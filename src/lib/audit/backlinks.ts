import type { BacklinkRow } from "./schema";

export { cleanDomain } from "./match";

export function backlinksEnabled(): boolean {
  return !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD);
}

interface SummaryResult {
  rank?: number;
  backlinks?: number;
  referring_domains?: number;
  referring_main_domains?: number;
  backlinks_spam_score?: number;
}

// DataForSEO Backlinks API, Summary (live). Each call costs a few cents. Its
// "rank" is DataForSEO's own authority score (0-100 here), not Ahrefs DR or
// Moz DA.
export async function fetchBacklinks(domain: string): Promise<BacklinkRow> {
  const base: BacklinkRow = {
    domain,
    ok: false,
    error: null,
    rank: null,
    backlinks: null,
    referringDomains: null,
    referringMainDomains: null,
    spamScore: null,
  };
  const auth = Buffer.from(`${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`).toString("base64");
  let res: Response;
  try {
    res = await fetch("https://api.dataforseo.com/v3/backlinks/summary/live", {
      method: "POST",
      headers: { authorization: `Basic ${auth}`, "content-type": "application/json" },
      body: JSON.stringify([
        { target: domain, include_subdomains: true, internal_list_limit: 1, rank_scale: "one_hundred" },
      ]),
      signal: AbortSignal.timeout(40_000),
    });
  } catch {
    return { ...base, error: "The backlink service took too long to respond." };
  }

  // DataForSEO reports most errors in the body with an HTTP 200, so check both.
  let json: {
    status_code?: number;
    tasks?: { status_code?: number; status_message?: string; result?: SummaryResult[] | null }[];
  } = {};
  try {
    json = await res.json();
  } catch {
    // handled below
  }
  const task = json.tasks?.[0];
  if (res.status === 401 || json.status_code === 40100 || task?.status_code === 40100) {
    console.error("[audit] DataForSEO rejected the credentials");
    return { ...base, error: "The backlink service rejected its credentials." };
  }
  if (res.status === 402 || task?.status_code === 40200 || task?.status_code === 40210) {
    console.error("[audit] DataForSEO account has insufficient funds");
    return { ...base, error: "The backlink service is out of credit." };
  }
  if (!res.ok || task?.status_code !== 20000) {
    console.error(`[audit] DataForSEO error: HTTP ${res.status} task ${task?.status_code} ${task?.status_message}`);
    return { ...base, error: "No backlink data was available for this site." };
  }
  const r = task.result?.[0];
  if (!r) return { ...base, error: "No backlink data was available for this site." };
  return {
    domain,
    ok: true,
    error: null,
    rank: typeof r.rank === "number" ? r.rank : null,
    backlinks: typeof r.backlinks === "number" ? r.backlinks : null,
    referringDomains: typeof r.referring_domains === "number" ? r.referring_domains : null,
    referringMainDomains: typeof r.referring_main_domains === "number" ? r.referring_main_domains : null,
    spamScore: typeof r.backlinks_spam_score === "number" ? r.backlinks_spam_score : null,
  };
}
