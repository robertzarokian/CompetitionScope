import { extractBrands } from "./extract";
import { brandKey, domainFromWebsite, domainOf, guessDomain, matchBrand } from "./match";
import { getProvider } from "./providers";
import type { AuditInput, RecommendedBrand, VisibilityRun } from "./schema";

export async function runVisibility(
  providerId: string,
  question: string,
  run: number,
  input: Pick<AuditInput, "companyName" | "competitors" | "scope" | "city" | "region" | "countryCode">
): Promise<VisibilityRun> {
  const provider = getProvider(providerId);
  if (!provider || !provider.enabled()) {
    throw new Error("That AI platform is not available.");
  }

  const answer = await provider.ask({
    question,
    scope: input.scope,
    city: input.city,
    region: input.region,
    countryCode: input.countryCode,
  });

  const extraction = await extractBrands(question, answer);

  const sources = answer.sources.map((s) => ({
    url: s.url,
    title: s.title,
    domain: domainOf(s.url, s.title),
    cited: s.cited,
  }));
  const sourceDomains = Array.from(new Set(sources.map((s) => s.domain).filter(Boolean)));

  // Rank order from the model, de-duplicated, then renumbered 1..n.
  const seen = new Set<string>();
  const ordered = extraction.recommendations
    .filter((r) => r.name.trim().length > 0)
    .sort((a, b) => a.rank - b.rank)
    .filter((r) => {
      const key = brandKey(r.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);

  // Trust the extractor's website only if it is one of the domains actually seen.
  const knownDomains = new Set(sourceDomains);
  const brands: RecommendedBrand[] = ordered.map((r, i) => ({
    name: r.name.trim(),
    position: i + 1,
    domain: ((d) => (d && knownDomains.has(d) ? d : null))(domainFromWebsite(r.website)) ?? guessDomain(r.name, sourceDomains, question),
    sourceNumbers: Array.from(new Set(r.sourceNumbers.filter((n) => n >= 1 && n <= sources.length))),
    isClient: matchBrand(r.name, input.companyName),
    competitorName: input.competitors.find((c) => matchBrand(r.name, c)) ?? null,
  }));

  return {
    provider: provider.id,
    providerLabel: provider.label,
    question,
    run,
    ok: true,
    error: null,
    text: answer.text.slice(0, 6000),
    sources,
    brands,
  };
}
