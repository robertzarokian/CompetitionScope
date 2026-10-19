import * as cheerio from "cheerio";
import { safeFetch, parsePublicUrl, FetchBlockedError } from "./safeFetch";
import {
  buildKeywords,
  detectPlatform,
  hasKeyword,
  nodeTypes,
  normalizeInternalUrl,
  parseHtml,
  socialLinksOnPage,
  socialNetworkOf,
  type ParsedPage,
} from "./page";
import type { CheckRow, PageInfo, Scope, SiteAuditResult } from "./schema";

const PAGE_CAP = 100;
const MENU_PAGE_LIMIT = 30;
const HTML_TYPES = /html|xml|text/i;

const capped = (n: number) => (n > PAGE_CAP ? `over ${PAGE_CAP}` : String(n));
const about = (n: number) => (n > PAGE_CAP ? `over ${PAGE_CAP}` : `about ${n}`);
// "Over 100 pages", "1 page", "12 pages": a count phrase that is safe at the start of a sentence.
const pageCount = (n: number) =>
  n > PAGE_CAP ? `Over ${PAGE_CAP} pages` : n === 1 ? "1 page" : `${n} pages`;

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

function xmlLocs(xml: string): { locs: string[]; isIndex: boolean } {
  const $ = cheerio.load(xml, { xmlMode: true });
  const isIndex = $("sitemapindex").length > 0;
  const locs = $("loc")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  return { locs, isIndex };
}

interface SitemapResult {
  urls: string[];
  sitemapUrl: string | null;
  // URLs listed in child sitemaps named like "post-sitemap.xml" (how WordPress
  // and most SEO plugins keep blog posts), or null when there is no such file.
  postUrlCount: number | null;
}

const POST_SITEMAP = /post|blog|news|article/i;

async function readSitemaps(origin: string): Promise<SitemapResult> {
  const candidates: string[] = [];
  try {
    const robots = await safeFetch(`${origin}/robots.txt`, { timeoutMs: 5000, maxBytes: 200_000, contentType: /text/i });
    if (robots.status === 200) {
      for (const line of robots.body.split(/\r?\n/)) {
        const m = line.match(/^\s*sitemap:\s*(\S+)/i);
        if (m) candidates.push(m[1]);
      }
    }
  } catch {
    // robots.txt is optional
  }
  for (const p of ["/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml", "/wp-sitemap.xml"]) {
    candidates.push(`${origin}${p}`);
  }

  for (const candidate of Array.from(new Set(candidates)).slice(0, 6)) {
    try {
      const res = await safeFetch(candidate, { timeoutMs: 6000, maxBytes: 3_000_000, contentType: /xml|text/i });
      if (res.status !== 200 || !/<(urlset|sitemapindex)/i.test(res.body)) continue;
      const first = xmlLocs(res.body);
      if (!first.isIndex) return { urls: first.locs, sitemapUrl: candidate, postUrlCount: null };
      // Read the post sitemaps first so they are never cut off by the limit.
      const children = [
        ...first.locs.filter((l) => POST_SITEMAP.test(l)),
        ...first.locs.filter((l) => !POST_SITEMAP.test(l)),
      ].slice(0, 8);
      const childUrls = await mapLimit(children, 4, async (child) => {
        try {
          const c = await safeFetch(child, { timeoutMs: 6000, maxBytes: 3_000_000, contentType: /xml|text/i });
          return { child, locs: c.status === 200 ? xmlLocs(c.body).locs : [] };
        } catch {
          return { child, locs: [] as string[] };
        }
      });
      const postChildren = childUrls.filter((c) => POST_SITEMAP.test(c.child));
      return {
        urls: childUrls.flatMap((c) => c.locs).slice(0, 5000),
        sitemapUrl: candidate,
        postUrlCount: postChildren.length ? postChildren.reduce((n, c) => n + c.locs.length, 0) : null,
      };
    } catch {
      continue;
    }
  }
  return { urls: [], sitemapUrl: null, postUrlCount: null };
}

function citySlug(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const BLOG_PREFIX = /^\/(blog|news|articles|insights|resources|journal|posts|stories|learn)(\/|$)/i;
const BLOG_NOISE = /\/(page|category|tag|author|feed)\//i;

function status(good: boolean, warn: boolean): CheckRow["status"] {
  return good ? "good" : warn ? "warn" : "bad";
}

export interface SiteAuditInput {
  website: string;
  services: string;
  questions: string[];
  scope: Scope;
  city: string;
}

export async function runSiteAudit(input: SiteAuditInput): Promise<SiteAuditResult> {
  const startUrl = parsePublicUrl(input.website);
  const home = await safeFetch(startUrl.toString(), { timeoutMs: 10000, contentType: HTML_TYPES });
  if (home.status >= 400) {
    throw new FetchBlockedError(`The site answered with an error (${home.status}). Check the address and try again.`);
  }
  if (!home.body) {
    throw new FetchBlockedError("The address did not return a web page.");
  }
  const homeUrl = new URL(home.url);
  const origin = homeUrl.origin;
  const homePage = parseHtml(home.body, home.url);
  const keywords = buildKeywords(input.services, input.questions);

  const sitemapPromise = readSitemaps(origin);

  // Pages linked from the menu, falling back to any internal link.
  const homeNorm = normalizeInternalUrl(home.url, homeUrl);
  const menuLinks = homePage.links.filter((l) => l.inMenu);
  const pool = menuLinks.length >= 3 ? menuLinks : homePage.links;
  const toAnalyze = Array.from(new Set(pool.map((l) => l.url).filter((u) => u !== homeNorm))).slice(0, MENU_PAGE_LIMIT);

  const fetched = await mapLimit(toAnalyze, 6, async (url) => {
    try {
      const r = await safeFetch(url, { timeoutMs: 7000, contentType: HTML_TYPES });
      return { url, status: r.status, parsed: r.body ? parseHtml(r.body, r.url) : null };
    } catch {
      return { url, status: 0, parsed: null as ParsedPage | null };
    }
  });

  const sitemap = await sitemapPromise;

  const toInfo = (url: string, status: number, p: ParsedPage): PageInfo => ({
    url,
    status,
    title: p.title,
    metaDescription: p.metaDescription,
    h1: p.h1,
    wordCount: p.wordCount,
    titleHasKeyword: hasKeyword(p.title, keywords),
    h1HasKeyword: p.h1.some((h) => hasKeyword(h, keywords)),
    hasFaqSection: p.hasFaqSection,
    hasFaqSchema: p.hasFaqSchema,
  });

  const pages: PageInfo[] = [toInfo(home.url, home.status, homePage)];
  const discovered = new Set<string>(homePage.links.map((l) => l.url));
  if (homeNorm) discovered.add(homeNorm);
  for (const f of fetched) {
    if (f.parsed && f.status < 400) {
      pages.push(toInfo(f.url, f.status, f.parsed));
      f.parsed.links.forEach((l) => discovered.add(l.url));
    }
  }

  const sitemapUrls = sitemap.urls;
  const allUrls = Array.from(new Set([...sitemapUrls, ...discovered]));
  const pathOf = (u: string) => {
    try {
      return new URL(u).pathname;
    } catch {
      return "";
    }
  };

  const checks: CheckRow[] = [];

  // 1. Number of pages
  if (sitemap.sitemapUrl) {
    checks.push({
      n: 1,
      title: "Number of pages",
      status: "info",
      summary:
        sitemapUrls.length > PAGE_CAP
          ? `Over ${PAGE_CAP} pages, counted from the website's sitemap.`
          : `About ${sitemapUrls.length} pages, counted from the website's sitemap.`,
      details: [`Sitemap found at ${sitemap.sitemapUrl}`],
    });
  } else {
    checks.push({
      n: 1,
      title: "Number of pages",
      status: "warn",
      summary: `At least ${capped(discovered.size)} page${discovered.size === 1 ? "" : "s"} found by following links. No sitemap was found.`,
      details: [
        "A sitemap helps search engines and AI tools find every page. Adding one is recommended.",
        "This count only includes pages reachable from the main page and menu.",
      ],
    });
  }

  // 3. Mobile friendly
  const viewportOk = !!homePage.viewport && /width\s*=\s*device-width/i.test(homePage.viewport);
  checks.push({
    n: 3,
    title: "Mobile friendly",
    status: viewportOk ? "good" : "bad",
    summary: viewportOk
      ? "The main page is set up for mobile screens."
      : "The main page is missing the mobile viewport setting, so it may display poorly on phones.",
    details: [homePage.viewport ? `Viewport setting: ${homePage.viewport}` : "No viewport meta tag found."],
  });

  // 4. Blog
  const blogCandidates = allUrls.filter((u) => BLOG_PREFIX.test(pathOf(u)));
  const blogRoot = blogCandidates.map(pathOf).find((p) => BLOG_PREFIX.test(p));
  const blogRootName = blogRoot?.split("/")[1];
  let postCount: number | null = null;
  let blogMethod = "";
  const blogLinkInMenu = homePage.links.some((l) => /^(blog|news|articles|insights|resources|journal)$/i.test(l.text));
  if (sitemap.postUrlCount) {
    postCount = sitemap.postUrlCount;
    blogMethod = "counted from the sitemap's post list";
  } else if (blogRootName && sitemapUrls.length > 0) {
    postCount = sitemapUrls.filter((u) => {
      const p = pathOf(u);
      return new RegExp(`^/${blogRootName}/[^/]+`, "i").test(p) && !BLOG_NOISE.test(p);
    }).length;
    blogMethod = "counted from the sitemap";
  } else if (blogRootName) {
    try {
      const index = await safeFetch(`${origin}/${blogRootName}`, { timeoutMs: 7000, contentType: HTML_TYPES });
      const parsed = parseHtml(index.body, index.url);
      postCount = new Set(
        parsed.links.map((l) => l.url).filter((u) => new RegExp(`^/${blogRootName}/[^/]+`, "i").test(pathOf(u)) && !BLOG_NOISE.test(pathOf(u)))
      ).size;
      blogMethod = "counted from the first page of the blog";
    } catch {
      postCount = null;
    }
  }
  const blogFound = !!blogRootName || blogLinkInMenu || (sitemap.postUrlCount ?? 0) > 0;
  checks.push({
    n: 4,
    title: "Blog",
    status: !blogFound ? "bad" : (postCount ?? 0) >= 10 ? "good" : "warn",
    summary: !blogFound
      ? "No blog or news section was found. Regular articles help both search and AI tools understand and trust a business."
      : postCount === null
        ? "A blog or news section exists, but the number of posts could not be counted."
        : `A blog exists with ${about(postCount)} posts (${blogMethod}).`,
    details: blogRootName ? [`Found at ${origin}/${blogRootName}`] : [],
  });
  // Rows are reported in the order of the original requirements list.

  // 5. City pages
  if (input.scope === "local" && input.city) {
    const slug = citySlug(input.city);
    const cityName = input.city.toLowerCase();
    const urlMatches = allUrls.filter((u) => pathOf(u).toLowerCase().includes(slug));
    const pageMatches = pages
      .filter((p) => (p.title ?? "").toLowerCase().includes(cityName) || p.h1.some((h) => h.toLowerCase().includes(cityName)))
      .map((p) => p.url);
    const matches = Array.from(new Set([...urlMatches, ...pageMatches])).filter((u) => u !== home.url);
    // Pages that pair a service keyword with the city in the address look like
    // real landing pages, as opposed to blog posts that merely mention the city.
    const landing = matches.filter((u) => hasKeyword(pathOf(u).replace(/[-_/]+/g, " "), keywords));
    const hub = allUrls.find((u) => /\/(locations?|service-areas?|areas-we-serve|cities)(\/|$)/i.test(pathOf(u)));
    checks.push({
      n: 5,
      title: "City landing pages",
      status: landing.length >= 1 ? "good" : matches.length >= 1 ? "warn" : "bad",
      summary:
        landing.length >= 1
          ? `${pageCount(landing.length)} pair your services with ${input.city}. ${pageCount(matches.length)} in total mention ${input.city} in the address or title.`
          : matches.length >= 1
            ? `${pageCount(matches.length)} mention ${input.city}, but none look like a dedicated service-in-${input.city} landing page.`
            : `No page dedicated to ${input.city} was found. Local businesses usually need a page for each city they serve.`,
      details: [
        ...(landing.length ? landing : matches).slice(0, 5),
        hub ? `Locations page: ${hub}` : "No locations or service-areas page was found.",
      ],
    });
  } else {
    checks.push({
      n: 5,
      title: "City landing pages",
      status: "info",
      summary: "Not applicable. This check applies to businesses that serve a specific city.",
      details: [],
    });
  }

  // 9. SEO friendliness
  const ok = pages.filter((p) => p.status > 0 && p.status < 400);
  const missingTitle = ok.filter((p) => !p.title);
  const missingMeta = ok.filter((p) => !p.metaDescription);
  const missingH1 = ok.filter((p) => p.h1.length === 0);
  const thin = ok.filter((p) => p.wordCount < 300);
  const longTitle = ok.filter((p) => (p.title ?? "").length > 65);
  const titleCounts = new Map<string, number>();
  ok.forEach((p) => p.title && titleCounts.set(p.title, (titleCounts.get(p.title) ?? 0) + 1));
  const duplicateTitles = ok.filter((p) => p.title && (titleCounts.get(p.title) ?? 0) > 1);
  const keywordTitles = ok.filter((p) => p.titleHasKeyword);
  const keywordShare = ok.length ? keywordTitles.length / ok.length : 0;
  const issueCount = missingTitle.length + missingMeta.length + missingH1.length + duplicateTitles.length;
  const sample = (list: PageInfo[]) => list.slice(0, 3).map((p) => p.url).join(", ");
  const details: string[] = [];
  if (missingTitle.length) details.push(`Missing title tag (${missingTitle.length}): ${sample(missingTitle)}`);
  if (missingMeta.length) details.push(`Missing meta description (${missingMeta.length}): ${sample(missingMeta)}`);
  if (missingH1.length) details.push(`Missing main heading (${missingH1.length}): ${sample(missingH1)}`);
  if (duplicateTitles.length) details.push(`Duplicate titles (${duplicateTitles.length}): ${sample(duplicateTitles)}`);
  if (longTitle.length) details.push(`Titles longer than 65 characters (${longTitle.length}): ${sample(longTitle)}`);
  if (thin.length) details.push(`Thin content under 300 words (${thin.length}): ${sample(thin)}`);
  checks.push({
    n: 9,
    title: "SEO-friendly pages",
    status: status(keywordShare >= 0.7 && issueCount === 0, keywordShare >= 0.4 && issueCount <= ok.length),
    summary: `Checked ${ok.length} page${ok.length === 1 ? "" : "s"} (the main page and pages linked from the menu). ${keywordTitles.length} of ${ok.length} have your service keywords in the title tag.`,
    details,
  });

  // 10. sameAs schema
  const sameAsNodes = homePage.jsonLdNodes.filter((n) => Array.isArray(n.sameAs) || typeof n.sameAs === "string");
  const sameAs = Array.from(
    new Set(sameAsNodes.flatMap((n) => (Array.isArray(n.sameAs) ? n.sameAs : [n.sameAs]).filter((x): x is string => typeof x === "string")))
  );
  const onPage = socialLinksOnPage(home.body);
  const networksInSchema = new Set(sameAs.map((u) => socialNetworkOf(u)).filter(Boolean));
  const missingFromSchema = onPage.filter((u) => !networksInSchema.has(socialNetworkOf(u)));
  // A second "http" after the domain means the link was pasted into a template wrong.
  const malformed = sameAs.filter((u) => /^https?:\/\/[^/]+\/.*https?:\/\//i.test(u));
  checks.push({
    n: 10,
    title: "sameAs schema (social profiles)",
    status:
      sameAs.length === 0 ? "bad" : missingFromSchema.length > 0 || malformed.length > 0 ? "warn" : "good",
    summary:
      sameAs.length === 0
        ? "The main page does not use sameAs schema code to link the company's social profiles."
        : malformed.length > 0
          ? `sameAs schema links ${sameAs.length} profile${sameAs.length === 1 ? "" : "s"}, but ${malformed.length} ${malformed.length === 1 ? "link looks" : "links look"} broken.`
          : missingFromSchema.length > 0
            ? `sameAs schema links ${sameAs.length} profile${sameAs.length === 1 ? "" : "s"}, but ${missingFromSchema.length} social link${missingFromSchema.length === 1 ? "" : "s"} on the page ${missingFromSchema.length === 1 ? "is" : "are"} missing from it.`
            : `sameAs schema links ${sameAs.length} social profile${sameAs.length === 1 ? "" : "s"}.`,
    details: [
      ...malformed.map((u) => `Looks malformed, please fix: ${u}`),
      ...sameAs.filter((u) => !malformed.includes(u)).map((u) => `In schema: ${u}`),
      ...missingFromSchema.slice(0, 5).map((u) => `On page but not in schema: ${u}`),
    ],
  });

  // 11. FAQ
  const faqPages = pages.filter((p) => p.hasFaqSection);
  const faqNoSchema = faqPages.filter((p) => !p.hasFaqSchema);
  const faqWithSchema = pages.filter((p) => p.hasFaqSchema);
  checks.push({
    n: 11,
    title: "FAQ sections and FAQ schema",
    status:
      faqPages.length === 0 && faqWithSchema.length === 0
        ? "bad"
        : faqNoSchema.length > 0
          ? "warn"
          : "good",
    summary:
      faqPages.length === 0 && faqWithSchema.length === 0
        ? "No FAQ sections were found on the pages checked. FAQs are a common source for AI answers."
        : faqNoSchema.length > 0
          ? `${faqPages.length} page${faqPages.length === 1 ? " has" : "s have"} an FAQ section, but ${faqNoSchema.length} ${faqNoSchema.length === 1 ? "is" : "are"} missing FAQ schema code.`
          : `${faqPages.length} page${faqPages.length === 1 ? " has" : "s have"} an FAQ section with FAQ schema code.`,
    details: [
      ...faqNoSchema.slice(0, 5).map((p) => `FAQ without schema: ${p.url}`),
      ...faqWithSchema.slice(0, 5).map((p) => `FAQ schema present: ${p.url}`),
    ],
  });

  // 12. Platform
  const platform = detectPlatform(home.body, home.headers, homePage.generator);
  checks.push({
    n: 12,
    title: "Website platform",
    status: "info",
    summary: `${platform.name}${platform.confidence === "low" ? "" : ` (${platform.confidence} confidence)`}.`,
    details: [
      ...platform.evidence,
      "We cannot reliably tell whether a page was written by an AI tool, so that is not reported.",
    ],
  });

  const schemaTypes = Array.from(new Set(homePage.jsonLdNodes.flatMap(nodeTypes)));
  return {
    finalUrl: home.url,
    checks,
    pages,
    note: schemaTypes.length ? `Schema types on the main page: ${schemaTypes.slice(0, 8).join(", ")}.` : null,
  };
}
