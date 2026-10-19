import { brandKey } from "./match";
import { classifySource, type SourceType } from "./sources";
import type { VisibilityRun } from "./schema";

export interface BrandSource {
  url: string;
  title: string | null;
  domain: string;
  type: SourceType;
  count: number;
}

export interface BrandStat {
  key: string;
  name: string;
  isClient: boolean;
  isListedCompetitor: boolean;
  mentions: number; // how many answers named this brand
  avgPosition: number | null;
  bestPosition: number | null;
  inTop5: number;
  domain: string | null;
  providers: string[];
  sources: BrandSource[];
}

export interface QuestionAnalysis {
  question: string;
  answers: number;
  top: BrandStat[];
  clientMentions: number;
  clientBestPosition: number | null;
}

export interface DomainStat {
  domain: string;
  type: SourceType;
  count: number;
  brands: string[];
}

export interface Analysis {
  answers: number;
  failed: number;
  providers: string[];
  client: BrandStat;
  questions: QuestionAnalysis[];
  topBrands: BrandStat[];
  sourceTypes: { type: SourceType; count: number; share: number }[];
  topDomains: DomainStat[];
  advice: string[];
}

interface Acc {
  name: string;
  isClient: boolean;
  isListedCompetitor: boolean;
  runIds: Set<string>;
  positions: number[];
  domain: string | null;
  providers: Set<string>;
  sources: Map<string, BrandSource>;
}

const CLIENT_KEY = "__client__";

function accumulate(
  runs: VisibilityRun[],
  brandDomains: Set<string>
): Map<string, Acc> {
  const map = new Map<string, Acc>();
  for (const run of runs) {
    const runId = `${run.provider}|${run.question}|${run.run}`;
    for (const b of run.brands) {
      const key = b.isClient ? CLIENT_KEY : brandKey(b.competitorName ?? b.name);
      if (!key) continue;
      let acc = map.get(key);
      if (!acc) {
        acc = {
          name: b.competitorName ?? b.name,
          isClient: b.isClient,
          isListedCompetitor: !!b.competitorName,
          runIds: new Set(),
          positions: [],
          domain: null,
          providers: new Set(),
          sources: new Map(),
        };
        map.set(key, acc);
      }
      if (acc.runIds.has(runId)) continue;
      acc.runIds.add(runId);
      acc.positions.push(b.position);
      acc.providers.add(run.providerLabel);
      if (b.domain && !acc.domain) acc.domain = b.domain;
      for (const n of b.sourceNumbers) {
        const s = run.sources[n - 1];
        if (!s || !s.domain) continue;
        const existing = acc.sources.get(s.url);
        if (existing) existing.count += 1;
        else acc.sources.set(s.url, { url: s.url, title: s.title, domain: s.domain, type: classifySource(s.domain, brandDomains), count: 1 });
      }
    }
  }
  return map;
}

function toStat(key: string, acc: Acc): BrandStat {
  const positions = acc.positions;
  return {
    key,
    name: acc.name,
    isClient: acc.isClient,
    isListedCompetitor: acc.isListedCompetitor,
    mentions: acc.runIds.size,
    avgPosition: positions.length ? positions.reduce((a, b) => a + b, 0) / positions.length : null,
    bestPosition: positions.length ? Math.min(...positions) : null,
    inTop5: positions.filter((p) => p <= 5).length,
    domain: acc.domain,
    providers: Array.from(acc.providers),
    sources: Array.from(acc.sources.values()).sort((a, b) => b.count - a.count),
  };
}

const byStrength = (a: BrandStat, b: BrandStat) =>
  b.mentions - a.mentions || (a.avgPosition ?? 99) - (b.avgPosition ?? 99);

export function analyze(
  runs: VisibilityRun[],
  input: { companyName: string; clientDomain: string | null }
): Analysis {
  const ok = runs.filter((r) => r.ok);
  const failed = runs.length - ok.length;

  // Domains that belong to a recommended brand are "company websites".
  const brandDomains = new Set<string>();
  if (input.clientDomain) brandDomains.add(input.clientDomain);
  ok.forEach((r) => r.brands.forEach((b) => b.domain && brandDomains.add(b.domain)));

  const all = accumulate(ok, brandDomains);
  const emptyClient: BrandStat = {
    key: CLIENT_KEY,
    name: input.companyName,
    isClient: true,
    isListedCompetitor: false,
    mentions: 0,
    avgPosition: null,
    bestPosition: null,
    inTop5: 0,
    domain: input.clientDomain,
    providers: [],
    sources: [],
  };
  const stats = Array.from(all.entries()).map(([k, a]) => toStat(k, a));
  const client = stats.find((s) => s.isClient) ?? emptyClient;
  if (!client.domain) client.domain = input.clientDomain;
  const topBrands = stats.sort(byStrength).slice(0, 10);

  const questions: QuestionAnalysis[] = Array.from(new Set(ok.map((r) => r.question))).map((question) => {
    const qRuns = ok.filter((r) => r.question === question);
    const qStats = Array.from(accumulate(qRuns, brandDomains).entries()).map(([k, a]) => toStat(k, a));
    const qClient = qStats.find((s) => s.isClient);
    return {
      question,
      answers: qRuns.length,
      top: qStats.sort(byStrength).slice(0, 5),
      clientMentions: qClient?.mentions ?? 0,
      clientBestPosition: qClient?.bestPosition ?? null,
    };
  });

  // The sources behind the five strongest brands (not counting the client).
  const leaders = topBrands.filter((b) => !b.isClient).slice(0, 5);
  const typeCounts = new Map<SourceType, number>();
  const domainMap = new Map<string, DomainStat>();
  for (const brand of leaders) {
    for (const s of brand.sources) {
      typeCounts.set(s.type, (typeCounts.get(s.type) ?? 0) + s.count);
      const d = domainMap.get(s.domain) ?? { domain: s.domain, type: s.type, count: 0, brands: [] };
      d.count += s.count;
      if (!d.brands.includes(brand.name)) d.brands.push(brand.name);
      domainMap.set(s.domain, d);
    }
  }
  const totalRefs = Array.from(typeCounts.values()).reduce((a, b) => a + b, 0);
  const sourceTypes = Array.from(typeCounts.entries())
    .map(([type, count]) => ({ type, count, share: totalRefs ? count / totalRefs : 0 }))
    .sort((a, b) => b.count - a.count);
  const topDomains = Array.from(domainMap.values())
    .sort((a, b) => b.count - a.count || b.brands.length - a.brands.length)
    .slice(0, 10);

  return {
    answers: ok.length,
    failed,
    providers: Array.from(new Set(ok.map((r) => r.providerLabel))),
    client,
    questions,
    topBrands,
    sourceTypes,
    topDomains,
    advice: buildAdvice(input.companyName, client, ok.length, sourceTypes, topDomains),
  };
}

function buildAdvice(
  company: string,
  client: BrandStat,
  answers: number,
  types: Analysis["sourceTypes"],
  domains: DomainStat[]
): string[] {
  if (answers === 0) return [];
  const advice: string[] = [];
  const share = (t: SourceType) => types.find((x) => x.type === t)?.share ?? 0;
  const outside = domains.filter((d) => d.type !== "Company website");
  const leadTypes = types.filter((t) => t.type !== "Company website").slice(0, 2).map((t) => t.type.toLowerCase());
  const backedBy =
    leadTypes.length === 0
      ? "their own websites"
      : leadTypes.length === 1
        ? leadTypes[0]
        : `${leadTypes[0]}, followed by ${leadTypes[1]}`;

  if (client.mentions === 0) {
    advice.push(
      `${company} was not recommended in any of the ${answers} AI answers. The companies that were recommended are backed mostly by ${backedBy}.`
    );
  } else {
    advice.push(
      `${company} was recommended in ${client.mentions} of ${answers} AI answers${client.avgPosition ? `, at an average position of ${client.avgPosition.toFixed(1)}` : ""}.`
    );
  }
  if (outside.length > 0) {
    advice.push(
      `Get listed or featured on the websites AI leans on most for these questions: ${outside.slice(0, 5).map((d) => d.domain).join(", ")}.`
    );
  }
  if (share("News and press") >= 0.15) {
    advice.push("Earn press coverage. Articles and press releases on news websites are a visible source behind the top brands.");
  }
  if (share("Articles and blogs") >= 0.25) {
    advice.push("Third-party \"best of\" articles and roundups drive many recommendations. Aim to be included in the ones that rank well.");
  }
  if (share("Reviews and ratings") >= 0.15) {
    advice.push("Collect more customer reviews on the review sites that appear here, and respond to them.");
  }
  if (share("Directories and listings") >= 0.15) {
    advice.push("Complete and maintain your profiles on the business directories that appear here.");
  }
  if (share("Social and forums") >= 0.15) {
    advice.push("Take part in the communities where these brands are discussed, such as Reddit, Quora, and LinkedIn.");
  }
  if (share("Company website") >= 0.2) {
    advice.push("The top brands' own websites are cited often. Make sure yours clearly states your services, locations, and pricing, with FAQ sections and schema code.");
  }
  return advice.slice(0, 7);
}
