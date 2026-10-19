import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, ShieldCheck, FileDown, Search } from "lucide-react";
import { readDb } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { CompetitorCard } from "@/components/report/CompetitorCard";
import { SuccessFactorCard, RoadmapCard } from "@/components/report/ReportSections";
import { LockedSection } from "@/components/report/LockedSection";
import { LogoWatermark } from "@/components/decor/LogoWatermark";

export default async function ReportPreviewPage({
  params,
}: PageProps<"/report/[id]">) {
  const { id } = await params;
  const db = await readDb();
  const report = db.reports.find((r) => r.id === id);

  if (!report) notFound();
  if (report.unlocked) redirect(`/report/${id}/full`);

  const [firstCompetitor, ...restCompetitors] = report.competitors;
  const [firstFactor, ...restFactors] = report.successFactors;

  return (
    <div className="relative min-h-screen overflow-hidden pb-24">
      <LogoWatermark className="-right-20 -top-16 hidden lg:block" size={300} />

      <header className="relative flex items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
        <span className="hidden font-mono text-[11px] uppercase tracking-wide text-navy-400 sm:block">
          Report for {report.answers.companyName}
        </span>
      </header>

      <main className="relative mx-auto max-w-3xl px-6">
        {report.source === "mock" && (
          <div className="mb-6 border border-navy-300 bg-cream-200 px-4 py-3 text-center font-mono text-xs text-navy-400">
            Sample report. Demo mode is active because no live research API key is
            configured on this server.
          </div>
        )}

        <div className="text-center">
          <span className="inline-flex items-center gap-2 border border-brass-500/40 bg-navy-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-300">
            <Sparkles size={13} />
            Your CompetitionScope is ready
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold text-navy-800 sm:text-4xl">
            Here&rsquo;s what we found for {report.answers.companyName}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-navy-500 sm:text-base">
            {`We researched ${report.competitors.length} of your closest competitors. Here's a preview. Unlock the full report to see all of it, ranked and broken down.`}
          </p>
        </div>

        {/* Free teaser insight */}
        <div className="mt-8 instrument-panel p-6">
          <p className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide text-brass-300">
            <Search size={13} />
            What we noticed first
          </p>
          <p className="mt-3 text-base leading-relaxed text-cream-50">
            {report.freeTeaserInsight}
          </p>
        </div>

        {/* Executive summary */}
        <section className="mt-9">
          <p className="rule-brass mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-400">
            Executive summary
          </p>
          <p className="text-sm leading-relaxed text-navy-500">
            {report.executiveSummary}
          </p>
        </section>

        {/* Competitors */}
        <section className="mt-9">
          <p className="rule-brass mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-400">
            Your closest competitors
          </p>
          <div className="space-y-4">
            {firstCompetitor && <CompetitorCard competitor={firstCompetitor} />}
            {restCompetitors.length > 0 && (
              <LockedSection
                reportId={id}
                label={`See the other ${restCompetitors.length} competitors we found`}
              >
                <div className="space-y-4">
                  {restCompetitors.map((c) => (
                    <CompetitorCard key={c.name} competitor={c} />
                  ))}
                </div>
              </LockedSection>
            )}
          </div>
        </section>

        {/* Success factors */}
        <section className="mt-9">
          <p className="rule-brass mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-400">
            What they all have in common
          </p>
          <div className="space-y-3">
            {firstFactor && <SuccessFactorCard factor={firstFactor} />}
            {restFactors.length > 0 && (
              <LockedSection
                reportId={id}
                label={`${restFactors.length} more shared success factors`}
              >
                <div className="space-y-3">
                  {restFactors.map((f) => (
                    <SuccessFactorCard key={f.title} factor={f} />
                  ))}
                </div>
              </LockedSection>
            )}
          </div>
        </section>

        {/* Roadmap - fully locked */}
        <section className="mt-9">
          <p className="rule-brass mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-400">
            Your roadmap to outperform them
          </p>
          <div>
            <LockedSection
              reportId={id}
              label={`Your ${report.roadmap.length}-step prioritized roadmap`}
            >
              <div className="space-y-3">
                {report.roadmap.map((r) => (
                  <RoadmapCard key={r.priority} item={r} />
                ))}
              </div>
            </LockedSection>
          </div>
        </section>

        {/* Paywall CTA */}
        <section className="mt-12 instrument-panel p-8 text-center card-glow">
          <h2 className="font-display text-2xl font-semibold text-cream-50">
            Ready to see the whole picture?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-cream-200">
            Every competitor, every success factor, and a step-by-step roadmap,
            plus a branded PDF you can share with your team.
          </p>
          <div className="mx-auto mt-6 grid max-w-sm gap-2.5 text-left text-sm text-cream-200">
            {[
              `All ${report.competitors.length} competitor breakdowns, fully detailed`,
              `All ${report.successFactors.length} shared success factors`,
              `Your full ${report.roadmap.length}-step prioritized roadmap`,
              "A branded PDF export to keep and share",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="shrink-0 text-brass-400" />
                {item}
              </div>
            ))}
          </div>
          <Link href={`/checkout/${id}`} className="mt-7 inline-block">
            <Button size="lg">
              <FileDown size={16} />
              Unlock My Full Report
            </Button>
          </Link>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wide text-cream-300">
            One-time payment. No subscription.
          </p>
        </section>
      </main>
    </div>
  );
}
