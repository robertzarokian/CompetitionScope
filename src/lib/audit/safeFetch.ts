import http from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";
import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import type { Readable } from "node:stream";

// The audit fetches URLs typed in by anonymous visitors, so every request goes
// through here. It refuses private and internal addresses (SSRF), re-checks the
// address at connect time (DNS rebinding), follows redirects manually so each
// hop is checked again, and caps time and size.

export class FetchBlockedError extends Error {}

const MAX_REDIRECTS = 5;
const USER_AGENT = "CompetitionScopeAuditBot/1.0 (+https://www.competitionscope.com)";

export function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    // IPv4-mapped (::ffff:a.b.c.d) takes the IPv4 rules.
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return (
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb") ||
      lower.startsWith("ff")
    );
  }
  return true; // not an IP we understand: refuse
}

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number
) => void;

// Runs at connect time, so a hostname that resolves to a private address on
// the second lookup (DNS rebinding) is still refused.
function guardedLookup(
  hostname: string,
  options: object,
  callback: LookupCallback
) {
  dnsLookup(hostname, options, (err, address, family) => {
    if (err) return callback(err, address as string, family);
    const list: LookupAddress[] = Array.isArray(address)
      ? (address as LookupAddress[])
      : [{ address: address as string, family: family ?? 4 }];
    if (list.some((a) => isPrivateIp(a.address))) {
      return callback(new FetchBlockedError("That address is not allowed."), "", 4);
    }
    callback(null, address as string | LookupAddress[], family);
  });
}

export function parsePublicUrl(raw: string): URL {
  let value = raw.trim();
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new FetchBlockedError("That does not look like a valid web address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new FetchBlockedError("Only http and https addresses are allowed.");
  }
  if (url.username || url.password) {
    throw new FetchBlockedError("Addresses with credentials are not allowed.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new FetchBlockedError("Only standard web ports are allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && isPrivateIp(host)) {
    throw new FetchBlockedError("That address is not allowed.");
  }
  if (!net.isIP(host) && !host.includes(".")) {
    throw new FetchBlockedError("Enter a full domain name, like example.com.");
  }
  return url;
}

export interface SafeResponse {
  url: string;
  status: number;
  headers: http.IncomingHttpHeaders;
  body: string;
  ms: number;
}

interface FetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  // Only read the body when the content type matches; otherwise return it empty.
  contentType?: RegExp;
}

function requestOnce(
  url: URL,
  { timeoutMs = 8000, maxBytes = 2_500_000, contentType }: FetchOptions
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.request(
      url,
      {
        method: "GET",
        lookup: guardedLookup as never,
        headers: {
          "user-agent": USER_AGENT,
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5",
          "accept-encoding": "gzip, deflate, br",
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const type = String(res.headers["content-type"] ?? "");
        const isRedirect = [301, 302, 303, 307, 308].includes(status);
        if (isRedirect || (contentType && !contentType.test(type))) {
          res.resume();
          return resolve({ status, headers: res.headers, body: Buffer.alloc(0) });
        }
        let stream: Readable = res;
        const encoding = String(res.headers["content-encoding"] ?? "").toLowerCase();
        if (encoding === "gzip") stream = res.pipe(zlib.createGunzip());
        else if (encoding === "br") stream = res.pipe(zlib.createBrotliDecompress());
        else if (encoding === "deflate") stream = res.pipe(zlib.createInflate());

        const chunks: Buffer[] = [];
        let size = 0;
        stream.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            req.destroy(new Error("The page is too large to check."));
            return;
          }
          chunks.push(chunk);
        });
        stream.on("end", () =>
          resolve({ status, headers: res.headers, body: Buffer.concat(chunks) })
        );
        stream.on("error", reject);
      }
    );
    const deadline = setTimeout(() => req.destroy(new Error("The site took too long to respond.")), timeoutMs);
    req.on("error", (err) => {
      clearTimeout(deadline);
      reject(err);
    });
    req.on("close", () => clearTimeout(deadline));
    req.end();
  });
}

export async function safeFetch(rawUrl: string, options: FetchOptions = {}): Promise<SafeResponse> {
  const started = Date.now();
  let url = parsePublicUrl(rawUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const res = await requestOnce(url, options);
    const location = res.headers.location;
    if ([301, 302, 303, 307, 308].includes(res.status) && location) {
      url = parsePublicUrl(new URL(location, url).toString());
      continue;
    }
    return {
      url: url.toString(),
      status: res.status,
      headers: res.headers,
      body: res.body.toString("utf8"),
      ms: Date.now() - started,
    };
  }
  throw new FetchBlockedError("The site redirected too many times.");
}
