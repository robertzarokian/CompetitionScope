import { STARTING_PRICE_LABEL } from "./plans";
import type { FaqItem } from "./site";

export const AI_SEO_LINKS = [
  { href: "/ai-seo", label: "Overview" },
  { href: "/ai-seo/audit", label: "Run the audit" },
  { href: "/ai-seo/what-is-ai-seo", label: "What is AI SEO?" },
  { href: "/ai-seo/checklist", label: "The 12 checks" },
] as const;

export interface AiSeoCheck {
  n: number;
  title: string;
  short: string;
  why: string;
  fix: string;
}

// The twelve website checks the audit runs. Numbers match the "n" on each
// result row in lib/audit/site.ts, so keep both in step.
export const AI_SEO_CHECKS: AiSeoCheck[] = [
  {
    n: 1,
    title: "Size of your website",
    short: "About how many pages you have.",
    why: "AI assistants and search engines learn about you from your pages. A site with only a handful of pages gives them very little to quote.",
    fix: "Add a page for every service, location, and common customer question. Aim for depth over filler.",
  },
  {
    n: 2,
    title: "Speed of your main page",
    short: "How fast your home page loads.",
    why: "Slow pages lose visitors and get crawled less. Speed is also a ranking signal.",
    fix: "Compress images, remove heavy scripts, and use a fast host.",
  },
  {
    n: 3,
    title: "Mobile friendly",
    short: "Whether your site works on a phone.",
    why: "Most searches happen on phones, and Google judges your site by its mobile version first.",
    fix: "Use a responsive theme and make sure the mobile viewport setting is present.",
  },
  {
    n: 4,
    title: "Blog and articles",
    short: "Whether you publish, and how much.",
    why: "AI answers lean on pages that explain things clearly. Articles are how you show expertise on the questions customers ask.",
    fix: "Publish helpful articles that answer the exact questions you want to be recommended for.",
  },
  {
    n: 5,
    title: "City landing pages",
    short: "A dedicated page for each place you serve.",
    why: "Local businesses are recommended for places they clearly name. One page per city makes that obvious.",
    fix: "Create a unique page for each city, with local details, reviews, and a clear call to action.",
  },
  {
    n: 6,
    title: "Authority and backlinks",
    short: "How many sites link to you, and how trusted they are.",
    why: "Links from trusted sites are the strongest signal that you are a real, reputable business. Competitors with more of them tend to win.",
    fix: "Earn links from local directories, industry groups, partners, press, and customers.",
  },
  {
    n: 7,
    title: "Ad spend",
    short: "Honest answer: no tool can know this.",
    why: "No outside tool can reliably tell how much a company spends on ads, so we do not pretend to. Active ads are public though, which shows who is investing to win your customers.",
    fix: "Use the ad library links in your results to see what rivals are running before you decide where to compete.",
  },
  {
    n: 8,
    title: "Ad platforms",
    short: "Where rivals run ads, through public ad libraries.",
    why: "Google, Facebook, Instagram, YouTube, and LinkedIn each publish their ads. Seeing where a rival advertises shows where they believe your customers are.",
    fix: "Match your presence to the platforms where your competitors are already investing.",
  },
  {
    n: 9,
    title: "SEO friendly pages",
    short: "Titles and content built around your keywords.",
    why: "Clear titles and headings tell both search engines and AI what each page is about.",
    fix: "Put your service and location in each title tag and main heading, in plain words.",
  },
  {
    n: 10,
    title: "sameAs social links",
    short: "Your profiles tied to your website in code.",
    why: "The sameAs setting tells machines that your website, LinkedIn, and other profiles are all the same business.",
    fix: "Add Organization schema with a sameAs list of your official profiles to your home page.",
  },
  {
    n: 11,
    title: "FAQ sections and FAQ schema",
    short: "Questions answered on your pages, marked up for machines.",
    why: "FAQ content mirrors how people ask AI for help, and the markup makes your answers easy to lift.",
    fix: "Add real FAQs to key pages and mark them up with FAQPage schema.",
  },
  {
    n: 12,
    title: "Website platform",
    short: "What your site is built on.",
    why: "WordPress, Wix, Shopify, and others each have their own strengths and limits for SEO.",
    fix: "Know your platform's limits before you invest, and pick plugins or settings that cover the gaps.",
  },
];

export const AI_SEO_STEPS = [
  {
    title: "Tell us about your business",
    body: "Your company, website, services, up to 5 competitors, where you work, and up to 3 questions you want AI to recommend you for.",
  },
  {
    title: "We ask the AI assistants",
    body: "We put your questions to AI assistants, several times each, and record who they recommend and in what order.",
  },
  {
    title: "We trace the sources",
    body: "For every recommended company we list the websites the answer relied on, then summarize which sources help companies reach the top.",
  },
  {
    title: "You get a plan",
    body: "Plus a 12 point check of your own website and your backlink strength against your competitors, so you know exactly what to fix first.",
  },
] as const;

export const EXAMPLE_QUESTIONS = [
  "Top 5 solar companies in Los Angeles, California",
  "Best accounting software for small business",
  "Best family dentist in Austin, Texas",
] as const;

export const AI_SEO_FAQS: FaqItem[] = [
  {
    id: "ai-what",
    question: "What is AI SEO?",
    answer:
      "AI SEO, also called GEO (generative engine optimization), AEO (answer engine optimization), or LLM SEO, is the work of getting AI assistants to recommend your business when people ask them for advice. It builds on classic SEO but also depends on which websites the assistants trust and quote.",
  },
  {
    id: "ai-how",
    question: "How does the AI Visibility Audit work?",
    answer:
      "You give us your business details and the questions you want to rank for. We ask AI assistants those questions, record which companies they recommend, trace the websites behind those answers, and check your own site against 12 points.",
  },
  {
    id: "ai-free",
    question: "Is the AI Visibility Audit free?",
    answer:
      `The audit is included with every paid plan, from ${STARTING_PRICE_LABEL} a month. You can enter your details first and see exactly what you will get. Paid plans also re-run the audit on a schedule and alert you when your visibility changes.`,
  },
  {
    id: "ai-platforms",
    question: "Which AI assistants do you check?",
    answer:
      "The audit starts with Claude and adds ChatGPT, Perplexity, Gemini, and Grok as each is connected. The results page always shows which assistants were actually asked, so you never see results from one that was not checked.",
  },
  {
    id: "ai-guarantee",
    question: "Can you guarantee AI will recommend me?",
    answer:
      "No one can. AI answers change and are not controlled by any company. The audit shows what is happening today and which steps are most likely to improve your chances.",
  },
  {
    id: "ai-time",
    question: "How long does an audit take?",
    answer:
      "Usually a few minutes. Asking several assistants several times and checking your website takes longer than a normal report, so keep the tab open while it runs.",
  },
];
