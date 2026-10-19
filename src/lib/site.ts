import { STARTING_PRICE_LABEL } from "./plans";

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
    title: "Choose a plan to keep watching",
    short: "Unlock every report, then get automatic re-checks, trend lines, and alerts.",
    long: `Plans start at ${STARTING_PRICE_LABEL} a month. You get every competitor breakdown, the success factors they share, and a prioritized roadmap, plus automatic re-checks, trend lines, change alerts, and a progress checklist so you can see whether your actions are working.`,
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
      "A free preview with an executive summary, the one insight we noticed first, and your first competitor in full detail, plus one AI visibility audit and a website check. The rest of the report needs a plan.",
  },
  {
    id: "included",
    question: "What does the full report include?",
    answer:
      "Your three closest competitors in full detail, the three success factors they share, and a three-step prioritized roadmap rated by impact and effort. Plans add automatic re-checks, trend lines, change alerts, and a progress checklist. Growth and Agency also include PDF reports.",
  },
  {
    id: "cost",
    question: "How much does it cost?",
    answer: `Plans start at ${STARTING_PRICE_LABEL} a month. Billing yearly gets you 2 months free. There are no setup fees, and the free preview costs nothing.`,
  },
  {
    id: "cancel",
    question: "Can I cancel anytime?",
    answer:
      "Yes. You can cancel from your dashboard whenever you like. You keep access until the end of the period you already paid for, and your history stays saved.",
  },
  {
    id: "alerts-scope",
    question: "What do the alerts cover?",
    answer:
      "Alerts cover changes we can measure: whether and how often AI recommends you, which competitors it names instead, new or dropped competitors in your refreshed report, and (on Growth and Agency) website and backlink changes. We do not currently track competitor price changes or ad spending.",
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
      "Not to preview your report, which needs only your email. You create an account to run the AI visibility audit or to subscribe, so your reports, history, and alerts are saved.",
  },
  {
    id: "pdf",
    question: "Can I download the report?",
    answer:
      "Yes, on the Growth and Agency plans. Agency plans can also put your own brand name on the PDF instead of ours.",
  },
  {
    id: "again",
    question: "Can I run it again or for another company?",
    answer:
      "Yes. With a plan, the company you track is re-checked automatically (monthly on Starter, weekly on Growth and Agency). You can also start a new scope any time for another company.",
  },
];
