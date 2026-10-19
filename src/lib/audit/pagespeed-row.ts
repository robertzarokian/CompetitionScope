import type { CheckRow, SpeedResult } from "./schema";

// Kept apart from pagespeed.ts, which uses server-only modules, so the browser
// can build this row from the API result.
const seconds = (ms: number | null) => (ms === null ? "n/a" : `${(ms / 1000).toFixed(1)}s`);

export function speedCheckRow(s: SpeedResult): CheckRow {
  if (!s.available || s.performance === null) {
    return {
      n: 2,
      title: "Website speed (main page, mobile)",
      status: "info",
      summary: s.reason ?? "The speed test is not available right now.",
      details: [],
    };
  }
  return {
    n: 2,
    title: "Website speed (main page, mobile)",
    status: s.performance >= 90 ? "good" : s.performance >= 50 ? "warn" : "bad",
    summary: `Google speed score ${s.performance} out of 100 on a mobile connection.`,
    details: [
      `Largest content paint: ${seconds(s.lcpMs)} (under 2.5s is good)`,
      `First content paint: ${seconds(s.fcpMs)}`,
      `Total blocking time: ${s.tbtMs === null ? "n/a" : `${Math.round(s.tbtMs)}ms`}`,
      `Layout shift: ${s.cls === null ? "n/a" : s.cls.toFixed(2)} (under 0.1 is good)`,
    ],
  };
}
