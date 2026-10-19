import type { Analysis, BrandSource, BrandStat } from "./audit/analysis";
import type { BacklinkRow, CheckRow } from "./audit/schema";

// Fictional AI visibility audit, website checks, and backlink data for the
// public /sample-report page. It follows the same shapes the live audit
// produces, so the sample renders with the real report components. Every
// company and website uses the reserved ".example" domain.

const src = (domain: string, title: string, type: BrandSource["type"], count: number): BrandSource => ({
  url: `https://${domain}/`,
  title,
  domain,
  type,
  count,
});

const brand = (b: Partial<BrandStat> & Pick<BrandStat, "key" | "name" | "mentions" | "avgPosition" | "bestPosition" | "inTop5">): BrandStat => ({
  isClient: false,
  isListedCompetitor: false,
  domain: null,
  providers: ["Claude", "ChatGPT"],
  sources: [],
  ...b,
});

const ledgerlark = brand({
  key: "ledgerlark",
  name: "Ledgerlark",
  isListedCompetitor: true,
  mentions: 7,
  avgPosition: 1.9,
  bestPosition: 1,
  inTop5: 7,
  domain: "ledgerlark.example",
  sources: [
    src("freelancetools.example", "The 12 best invoicing tools for freelancers", "Articles and blogs", 5),
    src("softwarereviews.example", "Ledgerlark reviews and ratings", "Reviews and ratings", 4),
    src("ledgerlark.example", "Ledgerlark vs Billbright vs Tallyfox", "Company website", 3),
    src("taxtimes.example", "What freelancers should look for in tax-ready software", "News and press", 2),
  ],
});

const billbright = brand({
  key: "billbright",
  name: "Billbright",
  isListedCompetitor: true,
  mentions: 7,
  avgPosition: 1.5,
  bestPosition: 1,
  inTop5: 7,
  domain: "billbright.example",
  sources: [
    src("softwarereviews.example", "Billbright reviews and ratings", "Reviews and ratings", 4),
    src("getpaidfaster.example", "How to get paid faster as a freelancer", "Articles and blogs", 3),
    src("forumcorner.example", "Best way to chase late invoices? (community thread)", "Social and forums", 3),
    src("billbright.example", "Pricing and free plan", "Company website", 2),
  ],
});

const fernbook = brand({
  key: "fernbook",
  name: "Fernbook",
  isListedCompetitor: true,
  mentions: 3,
  avgPosition: 3.7,
  bestPosition: 2,
  inTop5: 3,
  domain: "fernbook.example",
  providers: ["ChatGPT"],
  sources: [
    src("creatornews.example", "Tools every creative freelancer uses", "Articles and blogs", 2),
    src("softwarereviews.example", "Fernbook reviews and ratings", "Reviews and ratings", 1),
    src("fernbook.example", "Templates and contracts for creatives", "Company website", 1),
  ],
});

const tallyfox = brand({
  key: "tallyfox",
  name: "Tallyfox",
  isClient: true,
  mentions: 1,
  avgPosition: 4,
  bestPosition: 4,
  inTop5: 1,
  domain: "tallyfox.example",
  providers: ["ChatGPT"],
});

export const SAMPLE_ANALYSIS: Analysis = {
  answers: 8,
  failed: 0,
  providers: ["Claude", "ChatGPT"],
  client: tallyfox,
  questions: [
    {
      question: "Best invoicing software for freelancers",
      answers: 4,
      top: [{ ...ledgerlark, mentions: 4, avgPosition: 1.3, bestPosition: 1 }, { ...billbright, mentions: 3, avgPosition: 2, bestPosition: 1 }, { ...fernbook, mentions: 2, avgPosition: 3.5, bestPosition: 2 }, tallyfox],
      clientMentions: 1,
      clientBestPosition: 4,
    },
    {
      question: "Invoicing app that sends payment reminders automatically",
      answers: 4,
      top: [{ ...billbright, mentions: 4, avgPosition: 1, bestPosition: 1 }, { ...ledgerlark, mentions: 3, avgPosition: 2.7, bestPosition: 2 }, { ...fernbook, mentions: 1, avgPosition: 4, bestPosition: 4 }],
      clientMentions: 0,
      clientBestPosition: null,
    },
  ],
  topBrands: [ledgerlark, billbright, fernbook, tallyfox],
  sourceTypes: [
    { type: "Articles and blogs", count: 13, share: 0.3 },
    { type: "Reviews and ratings", count: 12, share: 0.27 },
    { type: "Company website", count: 8, share: 0.18 },
    { type: "Social and forums", count: 6, share: 0.14 },
    { type: "News and press", count: 3, share: 0.07 },
    { type: "Directories and listings", count: 2, share: 0.04 },
  ],
  topDomains: [
    { domain: "softwarereviews.example", type: "Reviews and ratings", count: 9, brands: ["Ledgerlark", "Billbright", "Fernbook"] },
    { domain: "freelancetools.example", type: "Articles and blogs", count: 5, brands: ["Ledgerlark", "Fernbook"] },
    { domain: "getpaidfaster.example", type: "Articles and blogs", count: 3, brands: ["Billbright"] },
    { domain: "forumcorner.example", type: "Social and forums", count: 3, brands: ["Billbright", "Ledgerlark"] },
    { domain: "creatornews.example", type: "Articles and blogs", count: 2, brands: ["Fernbook"] },
  ],
  advice: [
    "Tallyfox was recommended in 1 of 8 AI answers, at an average position of 4.0. The companies that were recommended are backed mostly by third-party articles, followed by review sites.",
    "Get listed or featured on the websites AI leans on most for these questions: softwarereviews.example, freelancetools.example, getpaidfaster.example, forumcorner.example, creatornews.example.",
    "Third-party \"best of\" articles and roundups drive many recommendations. Aim to be included in the ones that rank well.",
    "Collect more customer reviews on the review sites that appear here, and respond to them.",
    "Take part in the communities where these brands are discussed, such as forums and freelancer groups.",
    "Billbright was named first for every payment reminder question. Publish a clear page about your reminder feature so AI has something to quote.",
  ],
};

export const SAMPLE_CHECKS: CheckRow[] = [
  {
    n: 1,
    title: "Number of pages",
    status: "info",
    summary: "About 84 pages, counted from the website's sitemap.",
    details: ["Sitemap found at https://tallyfox.example/sitemap.xml", "Rivals in this category typically have 150 to 600 pages."],
  },
  {
    n: 2,
    title: "Website speed (main page, mobile)",
    status: "warn",
    summary: "Google speed score 62 out of 100 on a mobile connection.",
    details: [
      "Largest content paint: 3.8s (under 2.5s is good)",
      "First content paint: 1.9s",
      "Total blocking time: 410ms",
      "Layout shift: 0.04 (under 0.1 is good)",
    ],
  },
  {
    n: 3,
    title: "Mobile friendly",
    status: "good",
    summary: "The main page has the mobile viewport setting and should display well on phones.",
    details: ["Viewport setting: width=device-width, initial-scale=1"],
  },
  {
    n: 4,
    title: "Blog",
    status: "warn",
    summary: "A blog exists with about 9 posts (counted from the sitemap).",
    details: ["Found at https://tallyfox.example/blog", "Most posts are product announcements. None target comparison or \"how to get paid\" searches."],
  },
  {
    n: 5,
    title: "City landing pages",
    status: "info",
    summary: "Not applicable. This check applies to businesses that serve a specific city.",
    details: [],
  },
  {
    n: 9,
    title: "SEO-friendly pages",
    status: "warn",
    summary: "Checked 8 pages (the main page and pages linked from the menu). 3 of 8 have your service keywords in the title tag.",
    details: [
      "https://tallyfox.example/  Title: \"Tallyfox\"  (no keywords)",
      "https://tallyfox.example/features  Title: \"Features | Tallyfox\"  (no keywords)",
      "https://tallyfox.example/pricing  Title: \"Invoicing software pricing | Tallyfox\"  (keywords found)",
      "2 pages are missing a meta description.",
    ],
  },
  {
    n: 10,
    title: "sameAs schema (social profiles)",
    status: "bad",
    summary: "No sameAs schema was found on the main page, so machines cannot tie your social profiles to your website.",
    details: ["Add Organization schema with a sameAs list of your official LinkedIn, X, and other profiles."],
  },
  {
    n: 11,
    title: "FAQ sections and FAQ schema",
    status: "warn",
    summary: "FAQ sections were found on 2 pages, but none use FAQ schema code.",
    details: ["https://tallyfox.example/pricing", "https://tallyfox.example/features"],
  },
  {
    n: 12,
    title: "Website platform",
    status: "info",
    summary: "Built on Webflow (detected from page code).",
    details: [],
  },
];

export const SAMPLE_BACKLINKS: BacklinkRow[] = [
  { domain: "tallyfox.example", ok: true, error: null, rank: 31, backlinks: 4820, referringDomains: 390, referringMainDomains: 312, spamScore: 2 },
  { domain: "ledgerlark.example", ok: true, error: null, rank: 71, backlinks: 186400, referringDomains: 8200, referringMainDomains: 6950, spamScore: 1 },
  { domain: "billbright.example", ok: true, error: null, rank: 58, backlinks: 52300, referringDomains: 2600, referringMainDomains: 2180, spamScore: 1 },
  { domain: "fernbook.example", ok: true, error: null, rank: 44, backlinks: 11900, referringDomains: 780, referringMainDomains: 640, spamScore: 3 },
];

// Side-by-side comparison, built from the competitor research and the audit.
export const SAMPLE_MATRIX: { label: string; values: [string, string, string, string] }[] = [
  { label: "Match to your business", values: ["You", "94%", "88%", "79%"] },
  { label: "Estimated scale", values: ["$1M-$2M ARR", "$30M-$60M", "$8M-$15M", "$3M-$6M"] },
  { label: "Pricing shown before signup", values: ["No", "No", "Yes", "Yes"] },
  { label: "Comparison and alternatives pages", values: ["None", "140+", "12", "6"] },
  { label: "Free plan", values: ["14 day trial", "14 day trial", "Free forever plan", "Free forever plan"] },
  { label: "Automatic payment reminders", values: ["Basic", "Yes", "Yes, headline feature", "Yes"] },
  { label: "Recommended by AI (of 8 answers)", values: ["1", "7", "7", "3"] },
  { label: "Domain rank (0 to 100)", values: ["31", "71", "58", "44"] },
  { label: "Sites linking to them", values: ["312", "6,950", "2,180", "640"] },
  { label: "Main advertising", values: ["Search ads", "Search, review sites, sponsorships", "LinkedIn, referrals", "Newsletters, social"] },
];
