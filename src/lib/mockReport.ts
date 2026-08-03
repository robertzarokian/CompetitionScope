import { randomUUID } from "crypto";
import type {
  CompetitionScopeReport,
  CompetitorProfile,
  OnboardingAnswers,
  RoadmapItem,
  SuccessFactor,
} from "./types";

const NAME_PREFIXES = [
  "Bright",
  "North",
  "Clear",
  "Swift",
  "True",
  "Core",
  "Summit",
  "Vantage",
  "Nimbus",
  "Cobalt",
  "Anchor",
  "Pilot",
];

const NAME_SUFFIXES: Record<string, string[]> = {
  saas: ["Stack", "Cloud", "Loop", "Flow", "Base"],
  ecommerce: ["Market", "Cart", "Goods", "Supply Co."],
  fintech: ["Ledger", "Capital", "Vault", "Pay"],
  healthcare: ["Health", "Care", "Wellness Co.", "Clinic"],
  marketplace: ["Hub", "Exchange", "Marketplace", "Network"],
  agency: ["Studio", "Partners", "Collective", "Group"],
  hardware: ["Devices", "Labs", "Works", "Gear"],
  food: ["Kitchen", "Provisions", "Table", "Foods"],
  "real-estate": ["Realty", "Properties", "Estates", "Spaces"],
  education: ["Academy", "Learning", "Institute", "Prep"],
  media: ["Media", "Studios", "Network", "Press"],
  other: ["Group", "Co.", "Works", "HQ"],
};

const CHANNEL_POOL = [
  "SEO / long-form content",
  "Paid search (Google Ads)",
  "Paid social (Meta + LinkedIn)",
  "Influencer & affiliate partnerships",
  "Outbound / SDR-led sales",
  "Community-led growth",
  "Email lifecycle marketing",
  "Trade shows & industry events",
];

function pick<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  const pool = [...arr];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = (seed + i * 7) % pool.length;
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function makeCompetitorName(category: string, seed: number): string {
  const suffixes = NAME_SUFFIXES[category] ?? NAME_SUFFIXES.other;
  const prefix = NAME_PREFIXES[seed % NAME_PREFIXES.length];
  const suffix = suffixes[(seed * 3) % suffixes.length];
  return `${prefix}${suffix}`;
}

function revenueTierFor(rank: number): string {
  const tiers = [
    "$40M–$80M ARR (estimated)",
    "$20M–$40M ARR (estimated)",
    "$8M–$20M ARR (estimated)",
    "$3M–$8M ARR (estimated)",
  ];
  return tiers[Math.min(rank - 1, tiers.length - 1)];
}

export function generateMockReport(
  answers: OnboardingAnswers,
  ownerUserId: string | null
): CompetitionScopeReport {
  const seedBase = hashSeed(answers.companyName + answers.website + answers.category);
  const category = answers.category || "other";

  const competitors: CompetitorProfile[] = Array.from({ length: 4 }).map((_, i) => {
    const seed = seedBase + i * 101;
    const name = makeCompetitorName(category, seed);
    const rank = i + 1;
    const channels = pick(CHANNEL_POOL, 3, seed);
    const strengths = [
      "Faster time-to-value in onboarding than the category average",
      "Consistent publishing cadence that compounds organic search traffic",
      "A pricing ladder that makes upgrading feel obvious, not painful",
      "Visible social proof (case studies, reviews) placed right at the decision point",
      "A retention motion that keeps customers engaged after the first purchase",
    ];
    const successFactors = pick(strengths, 3, seed + 5);

    return {
      name,
      website: `https://www.${name.toLowerCase()}.com`,
      matchScore: Math.max(62, 96 - i * 9),
      ranking: rank,
      summary: `${name} operates in the same ${category} space as ${
        answers.companyName || "your company"
      } and has built a reputation around consistency — showing up in the same channels, with the same message, quarter after quarter.`,
      estimatedSalesTier: revenueTierFor(rank),
      salesStrategy:
        rank <= 2
          ? "Land-and-expand: an accessible entry offer paired with a clear, visible path to a higher-value tier once trust is established."
          : "Direct-response focused: heavier reliance on paid acquisition with tight payback-period targets and aggressive retargeting.",
      advertisingChannels: channels,
      strengths: pick(strengths, 3, seed + 2),
      successFactors,
    };
  });

  const factorPool: { title: string; description: string }[] = [
    {
      title: "A content engine that compounds",
      description:
        "Every competitor we researched publishes on a predictable cadence and targets the exact questions your prospects are already searching for — turning content into a durable acquisition channel instead of a one-off campaign.",
    },
    {
      title: "Friction-free first experience",
      description:
        "The leaders in this space get a new user to their 'aha moment' fast, often within minutes, with almost no setup required before value is visible.",
    },
    {
      title: "Pricing designed to be upgraded",
      description:
        "Instead of one flat price, top performers use a tiered ladder where the next tier is always visibly one step away — making expansion revenue a built-in part of the model, not an afterthought.",
    },
    {
      title: "Proof placed at the moment of doubt",
      description:
        "Case studies, testimonials, and specific numbers appear right where a buyer is likely to hesitate — not buried on a separate page nobody visits.",
    },
    {
      title: "A retention loop, not just an acquisition funnel",
      description:
        "The strongest competitors treat the first purchase as the start of the relationship, with lifecycle emails, community, or check-ins that bring customers back before they'd think to churn.",
    },
  ];

  const successFactors: SuccessFactor[] = factorPool.map((f, i) => ({
    ...f,
    competitorsSharingIt: 4 - Math.min(i, 1),
  }));

  const roadmap: RoadmapItem[] = [
    {
      priority: 1,
      title: "Ship one high-intent content asset every week",
      description: `Your competitors are winning long-term search traffic because they publish consistently against real buyer questions. Start with the three questions prospects ask you most in sales calls or support tickets, and answer each one as its own page.`,
      impact: "high",
      effort: "medium",
    },
    {
      priority: 2,
      title: "Cut time-to-first-value in your onboarding",
      description: `Map your current onboarding step by step and remove anything that happens before a new user sees real value. Every extra step is a place people quietly give up.`,
      impact: "high",
      effort: "medium",
    },
    {
      priority: 3,
      title: "Add a visible next tier to your pricing",
      description: `If you only have one plan, or a big gap between plans, prospects don't see a growth path with you — so they look elsewhere as they scale. Add a clear middle tier that feels like a natural upgrade.`,
      impact: "medium",
      effort: "low",
    },
    {
      priority: 4,
      title: "Put proof exactly where hesitation happens",
      description: `Identify the one or two moments in your funnel where people drop off, and place a specific, numbers-backed testimonial or case study right there — not on a generic "Customers" page.`,
      impact: "medium",
      effort: "low",
    },
    {
      priority: 5,
      title: "Build a lightweight post-purchase touchpoint",
      description: `A short check-in sequence (email, in-app, or a real human) in the first two weeks after purchase is one of the cheapest ways to close the retention gap your competitors have already closed.`,
      impact: "medium",
      effort: "low",
    },
  ];

  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    ownerUserId,
    createdAt: now,
    status: "ready",
    unlocked: false,
    source: "mock",
    answers,
    executiveSummary: `${
      answers.companyName || "Your company"
    } is competing in a ${category} market where the winners have converged on a small set of repeatable habits. Based on your answers — particularly around "${
      answers.struggles.slice(0, 140) || "growth and consistency"
    }" — the gap between where you are and where the category leaders sit isn't about a single big swing. It's a handful of specific, fixable moves that compound. This report breaks down what your closest competitors are actually doing, in what order it matters, and what to do about it.`,
    competitors,
    successFactors,
    roadmap,
    freeTeaserInsight: `All ${competitors.length} of the competitors we researched share one growth lever ${
      answers.companyName || "you"
    } hasn't fully used yet — and it's responsible for a meaningful share of their new customer acquisition. Unlock the full report to see exactly which one, and the step-by-step roadmap to close the gap.`,
  };
}
