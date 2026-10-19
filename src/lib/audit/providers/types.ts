import type { Scope } from "../schema";

export type ProviderId = "claude" | "chatgpt" | "perplexity" | "gemini" | "grok";

export interface AskContext {
  question: string;
  scope: Scope;
  city: string;
  region: string;
  countryCode: string;
}

// A source an answer used. Its position in the list (starting at 1) is the
// number used by the [n] markers placed in the answer text.
export interface SourceDraft {
  url: string;
  title: string | null;
  snippet: string | null;
  cited: boolean;
}

export interface ProviderAnswer {
  text: string;
  sources: SourceDraft[];
}

export interface Provider {
  id: ProviderId;
  label: string;
  enabled(): boolean;
  ask(ctx: AskContext): Promise<ProviderAnswer>;
}

export class ProviderError extends Error {}

export interface Location {
  country: string;
  city?: string;
  region?: string;
}

// Only pass a location hint when the business actually serves a place.
export function locationFor(ctx: AskContext): Location | null {
  if (ctx.scope === "worldwide" || !ctx.countryCode) return null;
  if (ctx.scope === "national") return { country: ctx.countryCode };
  return {
    country: ctx.countryCode,
    ...(ctx.city ? { city: ctx.city } : {}),
    ...(ctx.region ? { region: ctx.region } : {}),
  };
}

export async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number,
  label: string
): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    throw new ProviderError(timedOut ? `${label} took too long to answer.` : `Could not reach ${label}.`);
  }
  const raw = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = JSON.parse(raw);
  } catch {
    // leave empty; handled below
  }
  if (!res.ok) {
    // Log the provider's message for the owner, but never echo it (or any key) to visitors.
    console.error(`[audit] ${label} HTTP ${res.status}: ${raw.slice(0, 400)}`);
    if (res.status === 401 || res.status === 403) throw new ProviderError(`${label} rejected the API key.`);
    if (res.status === 429) throw new ProviderError(`${label} is rate limiting requests. Try again shortly.`);
    throw new ProviderError(`${label} returned an error (${res.status}).`);
  }
  return json;
}

// Inserts " [n]" markers into text at the given character offsets. Offsets are
// applied from the end so earlier insertions do not shift later ones.
export function insertMarkers(text: string, marks: { at: number; n: number }[]): string {
  const sorted = [...marks].sort((a, b) => b.at - a.at);
  let out = text;
  for (const m of sorted) {
    const at = Math.max(0, Math.min(out.length, m.at));
    out = `${out.slice(0, at)} [${m.n}]${out.slice(at)}`;
  }
  return out;
}

// Same, for APIs that report offsets in UTF-8 bytes.
export function insertMarkersByByte(text: string, marks: { at: number; n: number }[]): string {
  const buf = Buffer.from(text, "utf8");
  const sorted = [...marks].sort((a, b) => a.at - b.at);
  const parts: string[] = [];
  let last = 0;
  for (const m of sorted) {
    const at = Math.max(last, Math.min(buf.length, m.at));
    parts.push(buf.subarray(last, at).toString("utf8"), ` [${m.n}]`);
    last = at;
  }
  parts.push(buf.subarray(last).toString("utf8"));
  return parts.join("");
}

// Registers a URL as a source (first sighting decides its number) and returns that number.
export function sourceNumber(list: SourceDraft[], url: string, title: string | null, cited: boolean): number {
  const existing = list.findIndex((s) => s.url === url);
  if (existing >= 0) {
    if (cited) list[existing].cited = true;
    return existing + 1;
  }
  list.push({ url, title, snippet: null, cited });
  return list.length;
}

export function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value.filter((v) => v && typeof v === "object") as Record<string, unknown>[]) : [];
}
