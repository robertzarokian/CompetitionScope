import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Download, LineChart } from "lucide-react";
import { readDb } from "@/lib/db";
import { getUserIdFromSession } from "@/lib/auth";
import { getPlan } from "@/lib/account";
import { Logo } from "@/components/Logo";
import { CompetitorCard } from "@/components/report/CompetitorCard";
import { SuccessFactorCard, RoadmapCard } from "@/components/report/ReportSections";
import { LogoWatermark } from "@/components/decor/LogoWatermark";

export default async function FullReportPage({ params }: PageProps<"/report/[id]/full">) {
  const { id } = await params;

  const db = await readDb();
  const report = db.reports.find((r) => r.id === id);
  if (!report) notFound();

  // Reports bought before subscriptions stay unlocked, with their PDF.
  // Otherwise the viewer needs a paid plan, and the PDF needs a plan that includes it.
  const userId = await getUserIdFromSession();
  const plan = await getPlan(userId);
  const legacy = report.unlocked;
  if (!legacy && !plan.limits.fullReports) {
    redirect(`/pricing?report=${id}`);
  }
  const canPdf = legacy || plan.limits.pdf;

  return (
    <div className="relative min-h-screen overflow-hidden pb-24">
      <LogoWatermark className="-right-20 -top-16 hidden lg:block" size={300} />

      <header className="relative flex items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard?report=${id}`}
            className="inline-flex items-center gap-2 border border-navy-600 bg-cream-50 px-4 py-2 font-mono text-xs uppercase tracking-wide text-navy-700 transition hover:border-brass-500"
          >
            <LineChart size={14} />
            Track changes
          </Link>
          {canPdf ? (
            <a
              href={`/api/report/${id}/pdf`}
              className="inline-flex items-center gap-2 border border-navy-600 bg-navy-800 px-4 py-2 font-mono text-xs uppercase tracking-wide text-cream-100 transition hover:border-brass-400/60 hover:text-brass-300"
            >
              <Download size={14} />
              Download PDF
            </a>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 border border-navy-600 bg-cream-50 px-4 py-2 font-mono text-xs uppercase tracking-wide text-navy-500 transition hover:border-brass-500"
            >
              <Download size={14} />
              PDF on Growth
            </Link>
          )}
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 border border-brass-500/40 bg-navy-800 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-brass-300">
            <CheckCircle2 size={13} />
            Full report unlocked
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold text-navy-800 sm:text-4xl">
            {report.answers.companyName} vs. the competition
          </h1>
        </div>

        <section className="mt-9">
          <p className="rule-brass mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-400">
            Executive summary
          </p>
          <p className="text-sm leading-relaxed text-navy-500">
            {report.executiveSummary}
          </p>
        </section>

        <section className="mt-9">
          <p className="rule-brass mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-400">
            Competitor breakdown
          </p>
          <div className="space-y-4">
            {report.competitors.map((c) => (
              <CompetitorCard key={c.name} competitor={c} />
            ))}
          </div>
        </section>

        <section className="mt-9">
          <p className="rule-brass mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-400">
            What they all have in common
          </p>
          <div className="space-y-3">
            {report.successFactors.map((f) => (
              <SuccessFactorCard key={f.title} factor={f} />
            ))}
          </div>
        </section>

        <section className="mt-9">
          <p className="rule-brass mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-brass-400">
            Your roadmap to outperform them
          </p>
          <div className="space-y-3">
            {report.roadmap.map((r) => (
              <RoadmapCard key={r.priority} item={r} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
