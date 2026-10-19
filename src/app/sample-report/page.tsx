import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/SectionHeading";
import { CtaBand } from "@/components/site/CtaBand";
import { Panel } from "@/components/decor/Panel";
import { CompetitorCard } from "@/components/report/CompetitorCard";
import { SuccessFactorCard, RoadmapCard } from "@/components/report/ReportSections";
import { SampleSite, SampleVisibility } from "@/components/report/SampleAuditPanels";
import {
  SAMPLE_COMPANY,
  SAMPLE_COMPETITORS,
  SAMPLE_FACTORS,
  SAMPLE_ROADMAP,
  SAMPLE_SUMMARY,
  SAMPLE_TEASER,
} from "@/lib/sampleReport";
import { SAMPLE_ANALYSIS, SAMPLE_BACKLINKS, SAMPLE_CHECKS, SAMPLE_MATRIX } from "@/lib/sampleAudit";

export const metadata: Metadata = {
  title: "Sample Report: Competitor Analysis, Roadmap, and AI Audit",
  description:
    "One complete example of everything CompetitionScope produces: a ranked competitor analysis, a prioritized roadmap, an AI visibility audit, website checks, and backlink comparison. Every company shown is fictional.",
  alternates: { canonical: "/sample-report" },
};

const SECTIONS = [
  { id: "competitors", label: "1. Competitor analysis" },
  { id: "roadmap", label: "2. Roadmap" },
  { id: "ai-audit", label: "3. AI visibility audit" },
  { id: "website", label: "4. Website and backlinks" },
];

function Label({ children }: { children: string }) {
  return (
    <p className="rule-brass mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-400">
      {children}
    </p>
  );
}

function PartHeading({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="mb-6 border-b border-navy-300/60 pb-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brass-500">Part {n}</p>
      <h2 className="mt-1 font-display text-2xl font-semibold text-navy-800 sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-navy-500">{body}</p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="paper-panel border border-navy-600 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy-400">{label}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold text-navy-800">{value}</p>
      <p className="mt-0.5 text-xs text-navy-500">{sub}</p>
    </div>
  );
}

export default function SampleReportPage() {
  const good = SAMPLE_CHECKS.filter((c) => c.status === "good").length;
  const attention = SAMPLE_CHECKS.filter((c) => c.status === "warn" || c.status === "bad").length;
  const you = SAMPLE_BACKLINKS[0];
  const topRival = SAMPLE_BACKLINKS[1];

  return (
    <PageShell>
      <PageHero
        eyebrow="Sample report"
        title="One example of everything you get"
        intro="A complete report for a made-up software company: who the competition really is, a plan to beat them, how AI assistants see the market, and how the website and links compare. Read it end to end."
      />

      <div className="mx-auto max-w-5xl px-6 pb-8 sm:px-10">
        <div className="mb-8 border border-navy-300 bg-cream-200 px-4 py-3 text-center font-mono text-xs text-navy-500">
          Sample with fictional companies and figures. Your report names real competitors, researched live from the web.
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Competitors analyzed" value={String(SAMPLE_COMPETITORS.length)} sub="Ranked by how closely they match you" />
          <Stat
            label="AI recommended you"
            value={`${SAMPLE_ANALYSIS.client.mentions} of ${SAMPLE_ANALYSIS.answers}`}
            sub="Answers from Claude and ChatGPT"
          />
          <Stat
            label="Website checks"
            value={`${good} good, ${attention} to fix`}
            sub={`${SAMPLE_CHECKS.length} checks run on the site`}
          />
          <Stat
            label="Sites linking to you"
            value={String(you.referringMainDomains)}
            sub={`Top rival has ${topRival.referringMainDomains?.toLocaleString("en-US")}`}
          />
        </div>

        <nav aria-label="Report sections" className="sticky top-0 z-10 -mx-2 mt-6 flex flex-wrap gap-2 bg-cream-100/90 px-2 py-3 backdrop-blur">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="border border-navy-300/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-navy-500 transition-colors hover:border-navy-600 hover:text-navy-800"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="mt-6 instrument-panel p-6">
          <p className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-brass-300">
            <Search size={13} />
            What we noticed first
          </p>
          <p className="mt-3 text-base leading-relaxed text-cream-50">{SAMPLE_TEASER}</p>
        </div>

        <section className="mt-9">
          <Label>{`Executive summary for ${SAMPLE_COMPANY}`}</Label>
          <p className="text-sm leading-relaxed text-navy-500">{SAMPLE_SUMMARY}</p>
        </section>

        <section id="competitors" className="mt-14 scroll-mt-20">
          <PartHeading
            n={1}
            title="Competitor analysis"
            body="The companies you are most likely losing customers to, how big they are, how they sell, where they advertise, and why they are winning."
          />
          <div className="space-y-4">
            {SAMPLE_COMPETITORS.map((c) => (
              <CompetitorCard key={c.name} competitor={c} asText />
            ))}
          </div>

          <div className="mt-8">
            <Label>Side by side</Label>
            <Panel eyebrow="You versus your rivals" meta="From research and audit">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-navy-600 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-400">
                      <th className="px-5 py-3 font-normal" />
                      <th className="bg-brass-200/40 px-3 py-3 font-normal text-brass-600">{SAMPLE_COMPANY}</th>
                      {SAMPLE_COMPETITORS.map((c) => (
                        <th key={c.name} className="px-3 py-3 font-normal">
                          {c.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_MATRIX.map((row) => (
                      <tr key={row.label} className="border-b border-navy-300/60">
                        <td className="px-5 py-3 font-medium text-navy-800">{row.label}</td>
                        {row.values.map((v, i) => (
                          <td key={i} className={`px-3 py-3 text-navy-700 ${i === 0 ? "bg-brass-200/40" : ""}`}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          <div className="mt-8">
            <Label>What they all have in common</Label>
            <div className="space-y-3">
              {SAMPLE_FACTORS.map((f) => (
                <SuccessFactorCard key={f.title} factor={f} />
              ))}
            </div>
          </div>
        </section>

        <section id="roadmap" className="mt-14 scroll-mt-20">
          <PartHeading
            n={2}
            title="Your roadmap to outperform them"
            body="Three prioritized actions, each rated by impact and effort so you know what to do first. Paid plans add a progress checklist and re-checks that show whether your changes are working."
          />
          <div className="space-y-3">
            {SAMPLE_ROADMAP.map((r) => (
              <RoadmapCard key={r.priority} item={r} />
            ))}
          </div>
        </section>

        <section id="ai-audit" className="mt-14 scroll-mt-20">
          <PartHeading
            n={3}
            title="AI visibility audit"
            body="We asked AI assistants the questions your customers ask, recorded who they recommended, and traced the websites behind each answer. This is the live audit layout, filled with fictional results."
          />
          <SampleVisibility />
        </section>

        <section id="website" className="mt-14 scroll-mt-20">
          <PartHeading
            n={4}
            title="Website and backlink comparison"
            body="A check of your own website against what search engines and AI look for, plus how many sites link to you compared with your competitors."
          />
          <SampleSite />
        </section>
      </div>

      <CtaBand
        title="Get this for your own business."
        body="Answer 10 short questions and we research your real competitors. Plans add the AI visibility audit and ongoing tracking."
      />
    </PageShell>
  );
}
