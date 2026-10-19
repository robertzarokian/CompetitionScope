import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/SectionHeading";
import { CtaBand } from "@/components/site/CtaBand";
import { CompetitorCard } from "@/components/report/CompetitorCard";
import { SuccessFactorCard, RoadmapCard } from "@/components/report/ReportSections";
import {
  SAMPLE_COMPANY,
  SAMPLE_COMPETITORS,
  SAMPLE_FACTORS,
  SAMPLE_ROADMAP,
  SAMPLE_SUMMARY,
  SAMPLE_TEASER,
} from "@/lib/sampleReport";

export const metadata: Metadata = {
  title: "Sample Competitor Analysis Report",
  description:
    "See a full example CompetitionScope report with ranked competitors, shared success factors, and a prioritized roadmap. Every company shown is fictional.",
  alternates: { canonical: "/sample-report" },
};

function Label({ children }: { children: string }) {
  return (
    <p className="rule-brass mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-400">
      {children}
    </p>
  );
}

export default function SampleReportPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Sample report"
        title="See a full report before you start"
        intro="This is what an unlocked CompetitionScope report looks like. Every company and figure below is fictional, so you can read it end to end."
      />

      <div className="mx-auto max-w-3xl px-6 pb-8">
        <div className="mb-8 border border-navy-300 bg-cream-200 px-4 py-3 text-center font-mono text-xs text-navy-500">
          Sample with fictional companies. Your report names real competitors, researched
          live from the web.
        </div>

        <div className="instrument-panel p-6">
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

        <section className="mt-9">
          <Label>Your closest competitors</Label>
          <div className="space-y-4">
            {SAMPLE_COMPETITORS.map((c) => (
              <CompetitorCard key={c.name} competitor={c} asText />
            ))}
          </div>
        </section>

        <section className="mt-9">
          <Label>What they all have in common</Label>
          <div className="space-y-3">
            {SAMPLE_FACTORS.map((f) => (
              <SuccessFactorCard key={f.title} factor={f} />
            ))}
          </div>
        </section>

        <section className="mt-9">
          <Label>Your roadmap to outperform them</Label>
          <div className="space-y-3">
            {SAMPLE_ROADMAP.map((r) => (
              <RoadmapCard key={r.priority} item={r} />
            ))}
          </div>
        </section>
      </div>

      <CtaBand
        title="Get this for your own business."
        body="Answer 10 short questions and we research your real competitors."
      />
    </PageShell>
  );
}
