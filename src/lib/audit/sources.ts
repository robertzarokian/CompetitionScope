// Rough classification of where an AI answer got its information, so the report
// can show which kinds of websites help a company get recommended. This is
// based on the domain only, so it is labelled "approximate" in the UI.

export type SourceType =
  | "Company website"
  | "Reviews and ratings"
  | "News and press"
  | "Directories and listings"
  | "Social and forums"
  | "Reference (Wikipedia)"
  | "Articles and blogs";

const REVIEW = ["yelp.", "trustpilot.", "g2.com", "capterra.", "softwareadvice.", "getapp.", "bbb.org", "sitejabber.", "angi.com", "homeadvisor.", "thumbtack.", "houzz.", "avvo.", "glassdoor.", "consumeraffairs.", "productreview."];
const DIRECTORY = ["yellowpages.", "clutch.co", "goodfirms.", "manta.com", "superpages.", "mapquest.", "foursquare.", "crunchbase.", "tripadvisor.", "411.", "chamberofcommerce.", "expertise.com", "threebestrated.", "upcity.", "designrush.", "sortlist."];
const SOCIAL = ["reddit.com", "quora.com", "facebook.com", "instagram.com", "x.com", "twitter.com", "linkedin.com", "youtube.com", "tiktok.com", "pinterest.com", "medium.com", "substack.com"];
const REFERENCE = ["wikipedia.org", "wikidata.org", "britannica.com"];
const NEWS_HOSTS = ["reuters.com", "bloomberg.com", "forbes.com", "businessinsider.com", "cnn.com", "bbc.", "nytimes.com", "wsj.com", "theglobeandmail.com", "prnewswire.com", "businesswire.com", "globenewswire.com", "einpresswire.com", "newswire.ca", "apnews.com", "cnbc.com", "fortune.com", "inc.com", "entrepreneur.com", "techcrunch.com", "theverge.com", "wired.com"];
const NEWS_WORDS = /(news|times|herald|tribune|gazette|journal|press|daily|post|magazine|mag)\b/i;

const has = (host: string, list: string[]) => list.some((x) => host === x || host.includes(x));

export function classifySource(domain: string, brandDomains: Set<string>): SourceType {
  const host = domain.toLowerCase();
  if (brandDomains.has(host)) return "Company website";
  if (has(host, REFERENCE)) return "Reference (Wikipedia)";
  if (has(host, SOCIAL)) return "Social and forums";
  if (has(host, REVIEW)) return "Reviews and ratings";
  if (has(host, DIRECTORY)) return "Directories and listings";
  if (has(host, NEWS_HOSTS) || NEWS_WORDS.test(host.split(".")[0])) return "News and press";
  return "Articles and blogs";
}
