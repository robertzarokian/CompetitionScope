import type { CompetitorProfile, RoadmapItem, SuccessFactor } from "./types";

// The free preview shows blurred versions of the locked sections. They are
// built from placeholder text on the server, so the real content is never sent
// to the browser (blurring real text with CSS can be undone by anyone).
const FILLER =
  "Upgrade to a plan to read this part of your report, including the full detail we found for it. ";

function filler(length: number): string {
  const n = Math.max(24, Math.min(length, 220));
  return FILLER.repeat(Math.ceil(n / FILLER.length)).slice(0, n).trim();
}

export function maskCompetitor(c: CompetitorProfile): CompetitorProfile {
  return {
    name: `Competitor ${c.ranking}`,
    website: "https://example.com",
    matchScore: c.matchScore,
    ranking: c.ranking,
    summary: filler(c.summary.length),
    estimatedSalesTier: "Locked",
    salesStrategy: filler(c.salesStrategy.length),
    advertisingChannels: c.advertisingChannels.map(() => "Locked"),
    strengths: c.strengths.map((s) => filler(s.length)),
    successFactors: c.successFactors.map((s) => filler(s.length)),
  };
}

export function maskFactor(f: SuccessFactor): SuccessFactor {
  return {
    title: "Locked insight",
    description: filler(f.description.length),
    competitorsSharingIt: f.competitorsSharingIt,
  };
}

export function maskRoadmapItem(r: RoadmapItem): RoadmapItem {
  return {
    priority: r.priority,
    title: `Locked step ${r.priority}`,
    description: filler(r.description.length),
    impact: r.impact,
    effort: r.effort,
  };
}
