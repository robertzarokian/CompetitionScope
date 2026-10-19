import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/SectionHeading";
import { Panel } from "@/components/decor/Panel";
import { SiteChecksPanel } from "@/components/audit/SiteChecksPanel";
import { VisibilityPanel } from "@/components/audit/VisibilityPanel";
import { BacklinksPanel } from "@/components/audit/BacklinksPanel";
import { TodoList } from "@/components/dashboard/TodoList";
import { Trend } from "@/components/dashboard/Trend";
import { WatchActions } from "@/components/dashboard/WatchActions";
import { analyze } from "@/lib/audit/analysis";
import { cleanDomain } from "@/lib/audit/match";
import { speedCheckRow } from "@/lib/audit/pagespeed-row";
import { getCurrentUser } from "@/lib/auth";
import { getWatch, listRuns, markAlertsRead } from "@/lib/monitor/store";

export const metadata: Metadata = { title: "Tracked company", robots: { index: false } };

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default async function WatchPage({ params }: PageProps<"/dashboard/watch/[id]">) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=/dashboard");
  const { id } = await params;
  const watch = await getWatch(id, user.id);
  if (!watch) notFound();
  await markAlertsRead(user.id);

  const runs = await listRuns(id, user.id, 30);
  const done = runs.filter((r) => r.status === "done" && r.summary).reverse();
  const latest = done[done.length - 1] ?? null;
  const running = runs.some((r) => r.status === "running");
  const analysis = latest ? analyze(latest.runs, { companyName: watch.name, clientDomain: cleanDomain(watch.input.website) }) : null;
  const points = done
    .filter((r) => r.summary?.mentionRate !== null)
    .map((r) => ({ label: fmt(r.startedAt), value: r.summary?.mentionRate ?? 0 }));
  const checks = latest?.site ? [...latest.site.checks, ...(latest.speed ? [speedCheckRow(latest.speed)] : [])] : [];

  // How things moved since each item was ticked off.
  const firstRate = done[0]?.summary?.mentionRate ?? null;
  const lastRate = latest?.summary?.mentionRate ?? null;

  return (
    <PageShell>
      <PageHero eyebrow="Tracking" title={watch.name} intro={`${watch.input.website} · ${watch.input.questions.length} questions`} />
      <div className="mx-auto w-full max-w-4xl space-y-8 px-6 pb-16 sm:px-10">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600">
          <ArrowLeft size={13} /> Dashboard
        </Link>
        <WatchActions id={id} active={watch.active} runningInitially={running} />

        <Panel eyebrow="Trend" meta={`${done.length} checks`}>
          <div className="p-5">
            <p className="mb-3 text-sm text-navy-500">
              Share of AI answers that recommended {watch.name}.
              {firstRate !== null && lastRate !== null && done.length > 1 && ` Now ${Math.round(lastRate * 100)}%, from ${Math.round(firstRate * 100)}% at the first check.`}
            </p>
            <Trend points={points} />
          </div>
        </Panel>

        <Panel eyebrow="Checklist" meta="Progress">
          <div className="p-5">
            <TodoList watchId={id} items={watch.todo} />
          </div>
        </Panel>

        {analysis && analysis.answers > 0 && <VisibilityPanel analysis={analysis} errors={[]} runsPerQuestion={2} />}
        {latest?.site && <SiteChecksPanel checks={checks} note={latest.site.note} />}
        {latest?.backlinks && latest.backlinks.length > 0 && <BacklinksPanel rows={latest.backlinks} clientDomain={cleanDomain(watch.input.website)} />}

        {done.length > 1 && (
          <Panel eyebrow="History" meta="Newest first">
            <ul className="divide-y divide-navy-300/60 text-sm">
              {[...done].reverse().map((r) => (
                <li key={r.id} className="flex justify-between px-5 py-3 text-navy-600">
                  <span>{fmt(r.startedAt)}</span>
                  <span>
                    Recommended in {r.summary?.clientMentions} of {r.summary?.answers} answers
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </PageShell>
  );
}
