import { parsePublicUrl } from "./safeFetch";
import type { SpeedResult } from "./schema";

const unavailable = (reason: string): SpeedResult => ({
  available: false,
  reason,
  performance: null,
  lcpMs: null,
  cls: null,
  tbtMs: null,
  fcpMs: null,
  speedIndexMs: null,
  viewportOk: null,
});

// Google's PageSpeed Insights runs the test from Google's own servers.
// GOOGLE_PAGESPEED_API_KEY is optional but avoids the shared free quota.
export async function runPageSpeed(website: string): Promise<SpeedResult> {
  const url = parsePublicUrl(website).toString();
  const params = new URLSearchParams({ url, strategy: "mobile", category: "performance" });
  if (process.env.GOOGLE_PAGESPEED_API_KEY) params.set("key", process.env.GOOGLE_PAGESPEED_API_KEY);

  let res: Response;
  try {
    res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`, {
      signal: AbortSignal.timeout(50_000),
    });
  } catch {
    return unavailable("Google's speed test took too long to respond.");
  }
  if (res.status === 429) return unavailable("Google's free speed test is busy right now. Try again in a minute.");
  if (!res.ok) {
    console.error(`[audit] PageSpeed HTTP ${res.status}`);
    return unavailable("Google's speed test could not load this page.");
  }

  const json = (await res.json()) as {
    lighthouseResult?: {
      categories?: { performance?: { score?: number | null } };
      audits?: Record<string, { numericValue?: number; score?: number | null }>;
    };
  };
  const lh = json.lighthouseResult;
  if (!lh) return unavailable("Google's speed test returned no result.");
  const a = lh.audits ?? {};
  const num = (id: string) => (typeof a[id]?.numericValue === "number" ? (a[id].numericValue as number) : null);
  const score = lh.categories?.performance?.score;
  return {
    available: true,
    reason: null,
    performance: typeof score === "number" ? Math.round(score * 100) : null,
    lcpMs: num("largest-contentful-paint"),
    cls: num("cumulative-layout-shift"),
    tbtMs: num("total-blocking-time"),
    fcpMs: num("first-contentful-paint"),
    speedIndexMs: num("speed-index"),
    viewportOk: typeof a.viewport?.score === "number" ? a.viewport.score === 1 : null,
  };
}
