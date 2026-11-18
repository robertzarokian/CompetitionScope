import { STARTING_PRICE_LABEL } from "./plans";

export const SITE_URL = "https://www.competitionscope.com";

export const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/sample-report", label: "Sample report" },
  { href: "/ai-seo", label: "AI SEO" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
] as const;

// The public company page, without LinkedIn's "view as member" tracking
// parameters. Listed in the home page's sameAs schema and the footer.
export const LINKEDIN_URL = "https://www.linkedin.com/company/competitionscope/";

export const STEPS = [
  {
    title: "Answer 10 quick questions",
    short: "Your company, your website, what you sell, and what has been hard lately.",
    long: "Start with your email, then tell us your company name, website, and what you offer. We also ask what you are struggling with, how sales feel right now, and which marketing channels you use. If you already know a few rivals, list them. Most people finish in a few minutes.",
  },
  {
    title: "We research the web",
    short: "We look for the companies you are most likely losing customers to.",
    long: "We search the live web for the companies closest to you, then study each one: how they position themselves, how they price, where they advertise, roughly how big they are, and what they put front and center. Your answers steer the search, so what comes back is about you and not a generic list.",
  },
  {
    title: "See your free preview",
    short: "Your summary, the first thing we noticed, and your top rival in full.",
    long: "About a minute later your report is ready. The free preview gives you an executive summary, the first thing we noticed, and your closest competitor in full detail. The rest is blurred out so you can see what is waiting.",
  },
  {
    title: "Pick a plan to keep going",
    short: "Unlock every report and get automatic re-checks and alerts.",
    long: `Plans start at ${STARTING_PRICE_LABEL} a month. You get every competitor breakdown, what they have in common, and a prioritized roadmap. Plans also re-check your market on a schedule, chart how things change, email you alerts, and keep a checklist so you can tell whether your changes are working.`,
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
      "It is a research tool that finds your closest competitors on the live web and turns what it finds into a ranked report with a plan. You answer 10 quick questions about your business and we do the digging.",
  },
  {
    id: "how-found",
    question: "How do you find my competitors?",
    answer:
      "We start with your answers: what you sell, who you sell to, where you struggle, and any rivals you already know. Then we search the web for the companies you are most likely up against. Each one gets a match score, and we look at how they position themselves, how they price, where they advertise, and roughly how big they are.",
  },
  {
    id: "time",
    question: "How long does it take?",
    answer:
      "Most reports are ready in about a minute. Some take up to 2 minutes, so keep the tab open while we work.",
  },
  {
    id: "free",
    question: "What do I get for free?",
    answer:
      "A free preview with an executive summary, the first thing we noticed, and your closest competitor in full detail. The rest of the report, and the AI visibility audit, need a plan.",
  },
  {
    id: "included",
    question: "What is in the full report?",
    answer:
      "Your three closest competitors in full detail, the three success factors they share, and a three-step roadmap rated by impact and effort. Plans also add automatic re-checks, trend lines, change alerts, and a progress checklist. Growth and Agency plans include PDF reports.",
  },
  {
    id: "cost",
    question: "How much does it cost?",
    answer: `Plans start at ${STARTING_PRICE_LABEL} a month. Pay yearly and you get 2 months free. There are no setup fees, and the free preview costs nothing.`,
  },
  {
    id: "cancel",
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancel from your dashboard whenever you like. You keep access until the end of the period you paid for, and your history stays saved. New paid plans also come with a 7 day money-back guarantee, which our refund policy page explains.",
  },
  {
    id: "alerts-scope",
    question: "What do the alerts cover?",
    answer:
      "Things we can actually measure: whether and how often AI recommends you, which competitors it names instead, and new or dropped competitors when your report refreshes. On Growth and Agency, we also watch website and backlink changes. We do not track competitor price changes or ad spending.",
  },
  {
    id: "accuracy",
    question: "How accurate is the research?",
    answer:
      "The research is done by AI with live web search, so treat it as a strong starting point and not audited fact. Revenue and size figures are labeled estimates, and we never pass off private financials as real numbers. Double-check anything that matters before you make a big decision.",
  },
  {
    id: "known-rivals",
    question: "Can I add competitors I already know?",
    answer:
      "Yes. One optional question lets you list them. They guide the research, and we also look for the ones you missed.",
  },
  {
    id: "niche",
    question: "What if my business is very niche?",
    answer:
      "We use the closest real businesses we can find instead of making companies up. The more specific your answers, the better the match.",
  },
  {
    id: "account",
    question: "Do I need an account?",
    answer:
      "Not to see your preview. That only needs your email. You create an account when you subscribe, so your reports, history, and alerts are saved, and the AI visibility audit unlocks with it.",
  },
  {
    id: "pdf",
    question: "Can I download the report?",
    answer:
      "Yes, on the Growth and Agency plans. Agency plans can swap our name for your own brand on the PDF.",
  },
  {
    id: "again",
    question: "Can I run it again or for another company?",
    answer:
      "Yes. With a plan, the company you track is re-checked automatically, monthly on Starter and weekly on Growth and Agency. You can also start a new scope for another company any time.",
  },
];

// Where customers can reach us about privacy, billing, and refunds.
export const CONTACT_NOTE = "message us through our LinkedIn company page";
export const LEGAL_UPDATED = "October 19, 2026";
