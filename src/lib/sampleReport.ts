import type { CompetitorProfile, RoadmapItem, SuccessFactor } from "./types";

// Fictional company and fictional competitors for the public /sample-report
// page. Websites use the reserved ".example" TLD so they can never be real.
export const SAMPLE_COMPANY = "Tallyfox";

export const SAMPLE_SUMMARY =
  "Tallyfox sells invoicing software to freelancers, but flat trial signups against rising traffic point to a conversion and positioning problem rather than a demand problem. The deals you lose to unnamed rivals most likely go to Ledgerlark, Billbright, and Fernbook, which win on getting paid faster rather than on generic invoicing features.";

export const SAMPLE_TEASER =
  "Your traffic is not the problem. Three rivals have built a comparison-page moat that captures freelancers at the exact moment they pick a tool, and one of them ranks for searches that should be sending trials to you.";

export const SAMPLE_COMPETITORS: CompetitorProfile[] = [
  {
    name: "Ledgerlark",
    website: "https://ledgerlark.example",
    matchScore: 94,
    ranking: 1,
    summary:
      "A long-running invoicing and accounting platform built for solo professionals. It is the tool most freelancers shortlist first because it covers invoices, expenses, and tax prep in one place.",
    estimatedSalesTier: "$30M-$60M ARR (estimated)",
    salesStrategy:
      "Self-serve free trial with a paid upgrade for tax features, backed by a large library of comparison and alternatives pages that intercept buyers late in their search.",
    advertisingChannels: [
      "SEO comparison and alternatives pages",
      "Google Search ads on competitor terms",
      "Software review sites",
      "Freelancer community sponsorships",
    ],
    strengths: [
      "Covers invoicing, expenses, and tax prep in a single product",
      "Dominates search results for comparison queries",
      "Large base of public customer reviews that build trust",
    ],
    successFactors: [
      "Publishes head-to-head pages that rank for rival brand names",
      "Turns a commodity tool into a cash-flow tool in every headline",
    ],
  },
  {
    name: "Billbright",
    website: "https://billbright.example",
    matchScore: 88,
    ranking: 2,
    summary:
      "A fast-growing challenger focused on getting freelancers paid quickly. It is often chosen by people who are leaving spreadsheets or a clunkier legacy tool.",
    estimatedSalesTier: "$8M-$15M ARR (estimated)",
    salesStrategy:
      "Product-led growth with a generous free plan and automated payment reminders, supported by founder-led content on LinkedIn.",
    advertisingChannels: [
      "Founder-led LinkedIn content",
      "SEO guides for freelancers",
      "Referral rewards between users",
    ],
    strengths: [
      "Automatic reminders that visibly speed up payment",
      "Simple pricing that is clear before signup",
      "A strong personal brand behind the product",
    ],
    successFactors: [
      "Leads with faster payment instead of invoice templates",
      "Lets users feel the benefit inside the first session",
    ],
  },
  {
    name: "Fernbook",
    website: "https://fernbook.example",
    matchScore: 79,
    ranking: 3,
    summary:
      "A niche specialist serving creative freelancers such as designers and photographers. It wins by speaking the language of one community instead of everyone.",
    estimatedSalesTier: "$3M-$6M ARR (estimated)",
    salesStrategy:
      "Community-driven marketing with templates and contracts tailored to creatives, sold through partnerships with design schools and creator newsletters.",
    advertisingChannels: [
      "Creator newsletter sponsorships",
      "Partnerships with design communities",
      "Pinterest and Instagram content",
    ],
    strengths: [
      "Templates and contracts built for creative work",
      "Deep trust inside a tight-knit community",
      "Low customer acquisition cost through partners",
    ],
    successFactors: [
      "Owns one segment completely rather than competing on breadth",
      "Gets recommended by people its customers already follow",
    ],
  },
];

export const SAMPLE_FACTORS: SuccessFactor[] = [
  {
    title: "They win the comparison search",
    description:
      "All three rivals publish dense comparison and alternatives pages that appear at the moment a freelancer is choosing a tool. Your content is likely capturing early research traffic while they capture the shortlist.",
    competitorsSharingIt: 3,
  },
  {
    title: "Getting paid faster is the pitch",
    description:
      "Each competitor leads with faster payments, automatic reminders, and one-click pay links rather than invoice templates. That reframes a commodity tool as a cash-flow tool, which justifies a higher price.",
    competitorsSharingIt: 3,
  },
  {
    title: "Transparent entry pricing",
    description:
      "Billbright and Fernbook show their prices before signup, so a curious freelancer can qualify themselves in seconds. Hidden pricing is a common reason high traffic fails to turn into trials.",
    competitorsSharingIt: 2,
  },
];

export const SAMPLE_ROADMAP: RoadmapItem[] = [
  {
    priority: 1,
    title: "Publish honest comparison pages",
    description:
      "Create head-to-head pages against Ledgerlark, Billbright, and Fernbook, plus an alternatives hub. Add a question to your signup asking what tool people used before, so you finally learn who you are losing to.",
    impact: "high",
    effort: "medium",
  },
  {
    priority: 2,
    title: "Reposition around getting paid faster",
    description:
      "Rewrite your homepage and trial pages around payment speed and cash flow instead of invoice features. Put a before-and-after payment timeline in the first screen of the trial.",
    impact: "high",
    effort: "medium",
  },
  {
    priority: 3,
    title: "Show pricing before signup",
    description:
      "Put a clear per-month price and a no-credit-card trial above the fold. Track whether flat signups come from intent mismatch or from form drop-off before spending more on traffic.",
    impact: "medium",
    effort: "low",
  },
];
