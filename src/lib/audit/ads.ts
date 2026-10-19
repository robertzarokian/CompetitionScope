// Links into the public ad libraries where anyone can see whether a company is
// running ads. These libraries show the ads but not what is spent on them.
export function adLibraryLinks(name: string, domain: string | null) {
  const q = encodeURIComponent(name);
  return {
    meta: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${q}&search_type=keyword_unordered&media_type=all`,
    google: domain
      ? `https://adstransparency.google.com/?region=anywhere&domain=${encodeURIComponent(domain)}`
      : "https://adstransparency.google.com/",
    linkedin: `https://www.linkedin.com/ad-library/search?companyName=${q}`,
  };
}
