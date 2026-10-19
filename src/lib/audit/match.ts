// Brand-name matching and domain helpers shared by the server routes and the
// client-side analysis.

const GENERIC = new Set(["inc", "llc", "ltd", "limited", "corp", "corporation", "co", "company", "group", "the", "and", "of"]);

function tokens(name: string): string[] {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((t) => t && !GENERIC.has(t))
    // Light stemming so "Properties" matches "Property" and "Homes" matches "Home".
    .map((t) => {
      if (t.length > 4 && t.endsWith("ies")) return `${t.slice(0, -3)}y`;
      return t.length > 3 && t.endsWith("s") ? t.slice(0, -1) : t;
    });
}

// A stable key for grouping spelling variants of the same brand.
export function brandKey(name: string): string {
  return tokens(name).sort().join(" ");
}

// True when one name's words are all contained in the other's, so
// "Buttonwood" matches "Buttonwood Property Management" but
// "Property Management Toronto" does not.
export function matchBrand(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (!short.some((t) => t.length >= 3)) return false;
  return short.every((t) => long.includes(t));
}

export function domainOf(url: string, title?: string | null): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    // Gemini-style redirect links hide the real site; the title carries the domain.
    if (host.endsWith("vertexaisearch.cloud.google.com") && title && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(title)) {
      return title.toLowerCase().replace(/^www\./, "");
    }
    return host;
  } catch {
    return "";
  }
}

const DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

// "https://www.Example.com/page?x=1" -> "example.com", or null if it is not a domain.
export function cleanDomain(input: string): string | null {
  const d = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  return DOMAIN.test(d) ? d : null;
}

export function domainFromWebsite(website: string | null | undefined): string | null {
  if (!website) return null;
  const d = domainOf(/^https?:\/\//i.test(website) ? website : `https://${website}`);
  return d && d.includes(".") ? d : null;
}

// The main word of a domain: "buttonwood.ca" -> "buttonwood", "foo.co.uk" -> "foo".
function domainLabel(domain: string): string {
  const parts = domain.split(".");
  if (parts.length >= 3 && parts[parts.length - 2].length <= 3) return parts[parts.length - 3];
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

// Words shared by many businesses in the same trade. They say nothing about
// which company a website belongs to, so they never count as a match.
const GENERIC_BUSINESS = new Set([
  "property", "management", "manager", "service", "group", "solution", "realty", "real", "estate",
  "residential", "commercial", "community", "condo", "condominium", "consulting", "partner", "associate",
  "capital", "holding", "international", "canada", "toronto", "ontario", "marketing", "agency", "software",
  "systems", "digital", "global", "national", "local", "best", "top", "home", "house", "rental", "solar",
  "energy", "health", "care", "legal", "law", "financial", "insurance", "accounting", "design", "studio",
]);

// Fallback guess at a brand's own website from the sources an answer used,
// for when the extractor did not name one. Only distinctive words count.
export function guessDomain(brandName: string, sourceDomains: string[], question = ""): string | null {
  const all = tokens(brandName);
  const questionTokens = new Set(tokens(question));
  const distinctive = all.filter((t) => t.length >= 4 && !GENERIC_BUSINESS.has(t) && !questionTokens.has(t));
  const joinedAll = all.join("");
  for (const d of sourceDomains) {
    const label = domainLabel(d).replace(/[^a-z0-9]/g, "");
    if (!label) continue;
    if (label === joinedAll) return d;
    if (distinctive.some((t) => label === t || (label.length >= 5 && label.includes(t)))) return d;
  }
  return null;
}
