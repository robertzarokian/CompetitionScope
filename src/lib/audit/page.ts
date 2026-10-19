import * as cheerio from "cheerio";

export interface ParsedLink {
  url: string;
  text: string;
  inMenu: boolean;
}

export interface ParsedPage {
  title: string | null;
  metaDescription: string | null;
  canonical: string | null;
  h1: string[];
  wordCount: number;
  viewport: string | null;
  generator: string | null;
  jsonLdNodes: Record<string, unknown>[];
  links: ParsedLink[];
  hasFaqSection: boolean;
  hasFaqSchema: boolean;
  html: string;
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you", "our", "are", "what",
  "which", "who", "best", "top", "good", "great", "near", "some", "any", "can", "how",
  "companies", "company", "services", "service", "provider", "providers", "business",
  "businesses", "local", "find", "get", "need", "about", "into", "have", "has", "was",
  "were", "will", "all", "more", "most", "very", "than", "then", "them", "their", "there",
]);

// Keywords we expect a well-optimized page to mention: the owner's services and
// the words from the questions they want to rank for.
export function buildKeywords(services: string, questions: string[]): { phrases: string[]; words: string[] } {
  const phrases = services
    .split(/[,;\n]/)
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length >= 3 && p.length <= 60);
  const wordSource = [services, ...questions].join(" ").toLowerCase();
  const words = Array.from(
    new Set(
      wordSource
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
    )
  );
  return { phrases, words };
}

export function hasKeyword(text: string | null | undefined, kw: { phrases: string[]; words: string[] }): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return kw.phrases.some((p) => lower.includes(p)) || kw.words.some((w) => lower.includes(w));
}

function collectNodes(value: unknown, out: Record<string, unknown>[]) {
  if (Array.isArray(value)) {
    value.forEach((v) => collectNodes(v, out));
  } else if (value && typeof value === "object") {
    const node = value as Record<string, unknown>;
    out.push(node);
    if (node["@graph"]) collectNodes(node["@graph"], out);
    if (node.mainEntity) collectNodes(node.mainEntity, out);
  }
}

export function nodeTypes(node: Record<string, unknown>): string[] {
  const t = node["@type"];
  if (typeof t === "string") return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === "string");
  return [];
}

const ASSET_EXT = /\.(?:jpe?g|png|gif|webp|svg|ico|pdf|zip|css|js|mp4|mp3|woff2?|ttf|xml|json|docx?|xlsx?)$/i;

export function normalizeInternalUrl(href: string, base: URL): string | null {
  if (!href || href.startsWith("#") || /^(mailto|tel|javascript|sms):/i.test(href)) return null;
  let u: URL;
  try {
    u = new URL(href, base);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const sameSite = (h: string) => h.replace(/^www\./, "");
  if (sameSite(u.hostname) !== sameSite(base.hostname)) return null;
  if (ASSET_EXT.test(u.pathname)) return null;
  u.hash = "";
  u.search = "";
  let s = u.toString();
  if (s.endsWith("/") && u.pathname !== "/") s = s.slice(0, -1);
  return s;
}

export function parseHtml(html: string, pageUrl: string): ParsedPage {
  const $ = cheerio.load(html);
  const base = new URL(pageUrl);

  const jsonLdNodes: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text().trim();
    if (!raw) return;
    try {
      collectNodes(JSON.parse(raw), jsonLdNodes);
    } catch {
      // Malformed JSON-LD is common; skip it rather than fail the page.
    }
  });

  const links: ParsedLink[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const url = normalizeInternalUrl(href, base);
    if (!url) return;
    const inMenu = $(el).closest("nav, header, [role='navigation']").length > 0;
    links.push({ url, text: $(el).text().replace(/\s+/g, " ").trim().slice(0, 80), inMenu });
  });

  const headingTexts = $("h1, h2, h3, h4")
    .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
    .get();
  const questionHeadings = headingTexts.filter((t) => t.endsWith("?")).length;
  const detailsCount = $("details").length;
  const hasFaqSection =
    headingTexts.some((t) => /\bfaqs?\b|frequently asked/i.test(t)) ||
    detailsCount >= 2 ||
    questionHeadings >= 3;
  const hasFaqSchema = jsonLdNodes.some((n) => nodeTypes(n).includes("FAQPage"));

  $("script, style, noscript, svg").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();

  return {
    title: $("title").first().text().replace(/\s+/g, " ").trim() || null,
    metaDescription: $('meta[name="description"]').attr("content")?.trim() || null,
    canonical: $('link[rel="canonical"]').attr("href")?.trim() || null,
    h1: $("h1")
      .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
      .get()
      .filter(Boolean)
      .slice(0, 5),
    wordCount: text ? text.split(" ").length : 0,
    viewport: $('meta[name="viewport"]').attr("content")?.trim() || null,
    generator: $('meta[name="generator"]').attr("content")?.trim() || null,
    jsonLdNodes,
    links,
    hasFaqSection,
    hasFaqSchema,
    html,
  };
}

const SOCIAL_HOSTS: Record<string, string> = {
  "facebook.com": "Facebook",
  "instagram.com": "Instagram",
  "linkedin.com": "LinkedIn",
  "twitter.com": "X (Twitter)",
  "x.com": "X (Twitter)",
  "youtube.com": "YouTube",
  "tiktok.com": "TikTok",
  "pinterest.com": "Pinterest",
};

export function socialNetworkOf(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const [h, name] of Object.entries(SOCIAL_HOSTS)) {
      if (host === h || host.endsWith(`.${h}`)) return name;
    }
  } catch {
    // not a URL
  }
  return null;
}

export function socialLinksOnPage(html: string): string[] {
  const $ = cheerio.load(html);
  const found = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (/^https?:\/\//i.test(href) && socialNetworkOf(href)) found.add(href.split("?")[0]);
  });
  return Array.from(found);
}

export interface PlatformGuess {
  name: string;
  confidence: "high" | "medium" | "low";
  evidence: string[];
}

export function detectPlatform(html: string, headers: Record<string, string | string[] | undefined>, generator: string | null): PlatformGuess {
  const h = (k: string) => String(headers[k] ?? "").toLowerCase();
  const rules: { name: string; tests: [string, boolean][] }[] = [
    {
      name: "WordPress",
      tests: [
        ["wp-content or wp-includes paths", /\/wp-(content|includes)\//i.test(html)],
        ["WordPress generator tag", /wordpress/i.test(generator ?? "")],
        ["wp-json link", /\/wp-json\//i.test(html)],
      ],
    },
    {
      name: "Wix",
      tests: [
        ["wixstatic.com assets", /wixstatic\.com/i.test(html)],
        ["Wix generator tag", /wix\.com/i.test(generator ?? "")],
        ["Wix response header", Object.keys(headers).some((k) => k.startsWith("x-wix-"))],
      ],
    },
    {
      name: "Squarespace",
      tests: [
        ["squarespace assets", /squarespace(-cdn)?\.com|static1\.squarespace/i.test(html)],
        ["Squarespace generator tag", /squarespace/i.test(generator ?? "")],
      ],
    },
    {
      name: "Shopify",
      tests: [
        ["cdn.shopify.com assets", /cdn\.shopify\.com/i.test(html)],
        ["Shopify theme object", /Shopify\.theme|shopify-section/i.test(html)],
      ],
    },
    {
      name: "Webflow",
      tests: [
        ["Webflow site attribute", /data-wf-(site|page)/i.test(html)],
        ["Webflow generator tag", /webflow/i.test(generator ?? "")],
      ],
    },
    {
      name: "Joomla",
      tests: [
        ["Joomla generator tag", /joomla/i.test(generator ?? "")],
        ["Joomla media paths", /\/media\/jui\/|\/media\/system\/js\//i.test(html)],
      ],
    },
    {
      name: "Magento",
      tests: [
        ["Magento static paths", /\/static\/version\d+\/|mage\/cookies/i.test(html)],
        ["Magento cookies script", /Mage\.Cookies|\bMagento_/i.test(html)],
      ],
    },
    {
      name: "Drupal",
      tests: [
        ["Drupal generator tag", /drupal/i.test(generator ?? "")],
        ["Drupal paths", /\/sites\/default\/files\/|Drupal\.settings/i.test(html)],
        ["Drupal header", h("x-generator").includes("drupal")],
      ],
    },
    {
      name: "Next.js (custom build)",
      tests: [
        ["Next.js data or assets", /__NEXT_DATA__|\/_next\/static\//i.test(html)],
        ["Next.js header", h("x-powered-by").includes("next.js")],
      ],
    },
  ];

  // Pick the platform with the most matching signals, so one stray string for
  // a different platform can't win over a clear match.
  const scored = rules
    .map((rule) => ({
      name: rule.name,
      hits: rule.tests.filter(([, ok]) => ok).map(([label]) => label),
    }))
    .filter((r) => r.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length);
  if (scored.length > 0) {
    const best = scored[0];
    return {
      name: best.name,
      confidence: best.hits.length >= 2 ? "high" : "medium",
      evidence: best.hits,
    };
  }
  return {
    name: "Plain HTML or a custom build",
    confidence: "low",
    evidence: ["No known website platform was detected in the page code."],
  };
}
