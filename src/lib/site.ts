import { REPORT_PRICE_LABEL } from "./pricing";

export const SITE_URL = "https://www.competitionscope.com";

export const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/sample-report", label: "Sample report" },
  { href: "/ai-visibility", label: "AI visibility" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
] as const;

// The public company page, without LinkedIn's "view as member" tracking
// parameters. Listed in the home page's sameAs schema and the footer.
export const LINKEDIN_URL = "https://www.linkedin.com/company/competitionscope/";

export const STEPS = [
  {
    title: "Answer 10 short questions",
    short: "Your company, your website, what you sell, and where you are struggling.",
    long: "Start with your email, then tell us your company name, website, category, and what you provide. We also ask where you are struggling, how sales feel right now, and which marketing channels you use. If you already know some rivals, add them. It takes a few minutes.",
  },
  {
    title: "We research the live web",
    short: "We search for the rivals you are most likely losing to and study how they win.",
    long: "We search the web for the companies closest to you, then look at each one's positioning, pricing signals, marketing channels, apparent scale, and what they emphasize publicly. Your answers steer the search, so the findings stay specific to your situation.",
  },
  {
    title: "Preview your results free",
    short: "See your executive summary, our first insight, and your top competitor in full.",
    long: "In about a minute or two your report is ready. The free preview shows an executive summary, the first thing we noticed, and your closest competitor in full detail. The rest is previewed so you can see what is waiting.",
  },
  {
    title: "Unlock the full report",
    short: "Three competitors, shared success factors, a prioritized roadmap, and a PDF.",
    long: `Unlock everything for ${REPORT_PRICE_LABEL}, one time. You get every competitor breakdown, the success factors they share, a prioritized roadmap rated by impact and effort, and a branded PDF to keep and share.`,
  },
] as const;

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

// The "three competitors, three success factors, three roadmap steps" wording
// below matches the exact-count requirement in the report prompt
// (lib/anthropic.ts). If one changes, update the other.
export const FAQS: FaqItem[] = [
  {
    id: "what",
    question: "What is CompetitionScope?",
    answer:
      "CompetitionScope researches your closest competitors on the live web and turns what it finds into a ranked report with a prioritized plan. You answer 10 short questions about your business and we do the research.",
  },
  {
    id: "how-found",
    question: "How does it find my competitors?",
    answer:
      "We use your answers, such as what you sell, who you sell to, where you are struggling, and any rivals you already know, to search the web for the companies you are most likely competing with. Each one gets a match score, and we study its positioning, pricing signals, marketing channels, and apparent scale.",
  },
  {
    id: "time",
    question: "How long does it take?",
    answer:
      "Most reports finish in about a minute. Occasionally it takes up to 2 minutes, so keep the tab open while we work.",
  },
  {
    id: "free",
    question: "What do I get for free?",
    answer:
      "A free preview with an executive summary, the one insight we noticed first, and your first competitor in full detail. The rest of the report is unlocked with a one-time payment.",
  },
  {
    id: "included",
    question: "What does the full report include?",
    answer:
      "Your three closest competitors in full detail, the three success factors they share, a three-step prioritized roadmap rated by impact and effort, and a branded PDF you can keep and share.",
  },
  {
    id: "cost",
    question: "How much does it cost?",
    answer: `${REPORT_PRICE_LABEL} per report, paid once. There is no subscription and nothing renews.`,
  },
  {
    id: "accuracy",
    question: "How accurate is the research?",
    answer:
      "The research is done by AI with live web search, so treat it as a strong starting point rather than audited fact. Revenue and scale figures are labeled estimates, and we never present non-public financials as facts. Check any detail that matters before you base a big decision on it.",
  },
  {
    id: "known-rivals",
    question: "Can I add competitors I already know about?",
    answer:
      "Yes. One optional question lets you list rivals you already know. They guide the research, and we look for the ones you have missed.",
  },
  {
    id: "niche",
    question: "What if my business is very niche?",
    answer:
      "We use the closest real analogues we can find rather than inventing companies. The more specific your answers are, the better the match.",
  },
  {
    id: "account",
    question: "Do I need an account?",
    answer:
      "Not to start. You preview your report for free with just your email. You create an account when you unlock the full report, so you can come back to it later.",
  },
  {
    id: "pdf",
    question: "Can I download the report?",
    answer:
      "Yes. Unlocking the full report includes a branded PDF export you can keep and share with your team.",
  },
  {
    id: "again",
    question: "Can I run it again or for another company?",
    answer:
      "Yes. Each scope is its own report, so you can run a new one any time, for the same company to see what has changed or for a different one.",
  },
];
