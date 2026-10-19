import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/SectionHeading";
import { Panel } from "@/components/decor/Panel";
import { AddWatch } from "@/components/dashboard/AddWatch";
import { Settings } from "@/components/dashboard/Settings";
import { getCurrentUser } from "@/lib/auth";
import { getPlan, getProfile, getSubscription } from "@/lib/account";
import { syncFromCheckoutSession, syncUserFromStripe } from "@/lib/billing";
import { readDb } from "@/lib/db";
import { listAlerts, listRuns, listWatches } from "@/lib/monitor/store";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth?next=/dashboard");
  const sp = await searchParams;

  // Coming back from Stripe: confirm the payment with Stripe before showing the plan.
  if (typeof sp.session_id === "string") await syncFromCheckoutSession(sp.session_id, user.id);
  else await syncUserFromStripe(user.id);

  const plan = await getPlan(user.id);
  const sub = await getSubscription(user.id);
  const profile = await getProfile(user.id);
  const watches = await listWatches(user.id);
  const alerts = await listAlerts(user.id, 12);
  const reports = (await readDb()).reports
    .filter((r) => r.ownerUserId === user.id || r.answers.email.toLowerCase() === user.email.toLowerCase())
    .map((r) => ({ id: r.id, name: r.answers.companyName }));
  const latest = await Promise.all(watches.map((w) => listRuns(w.id, user.id, 1).then((r) => r[0] ?? null)));

  const usedQuestions = watches.reduce((n, w) => n + w.input.questions.length, 0);
  const canAdd = plan.limits.clients > watches.length && plan.limits.questions > usedQuestions;
  const reportParam = typeof sp.report === "string" ? sp.report : null;

  return (
    <PageShell>
      <PageHero eyebrow="Dashboard" title={`Your ${plan.name} plan`} intro={user.email} />
      <div className="mx-auto w-full max-w-6xl space-y-8 px-6 pb-16 sm:px-10">
        {sp.subscribed === "1" && plan.id !== "free" && (
          <p className="border border-brass-400/40 bg-brass-400/10 px-4 py-3 text-sm text-brass-700">
            Welcome to {plan.name}. Add a company below to start tracking.
          </p>
        )}

        <Panel eyebrow="Plan" meta={sub?.status ?? "free"}>
          <div className="space-y-3 p-5 text-sm text-navy-600">
            {plan.id === "free" ? (
              <p>
                You are on the free plan. <Link href="/pricing" className="font-medium text-brass-600 underline">See plans</Link> to unlock full
                reports and tracking.
              </p>
            ) : (
              <p>
                {plan.name}, {sub?.interval === "year" ? "billed yearly" : "billed monthly"}.
                {sub?.currentPeriodEnd && ` ${sub.cancelAtPeriodEnd ? "Ends" : "Renews"} ${fmt(sub.currentPeriodEnd)}.`} Tracking{" "}
                {watches.length} of {plan.limits.clients} companies and {usedQuestions} of {plan.limits.questions} questions.
              </p>
            )}
            <Settings
              emailAlerts={profile.emailAlerts}
              brandName={profile.brandName}
              whiteLabel={plan.limits.whiteLabel}
              canManageBilling={!!sub?.stripeCustomerId}
            />
          </div>
        </Panel>

        {alerts.length > 0 && (
          <Panel eyebrow="Recent changes" meta={`${alerts.filter((a) => !a.read).length} new`}>
            <ul className="divide-y divide-navy-300/60">
              {alerts.map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <p className="text-sm font-semibold text-navy-800">{a.title}</p>
                  <p className="text-[13px] text-navy-500">{a.body}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase text-navy-400">{fmt(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {watches.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {watches.map((w, i) => {
              const s = latest[i]?.summary;
              return (
                <Link key={w.id} href={`/dashboard/watch/${w.id}`} className="paper-panel block border border-navy-600 p-5 transition hover:border-brass-500">
                  <p className="font-display text-lg font-semibold text-navy-800">{w.name}</p>
                  <p className="mt-1 text-sm text-navy-500">
                    {latest[i]?.status === "running"
                      ? "Checking now"
                      : s && s.answers > 0
                        ? `Recommended in ${s.clientMentions} of ${s.answers} AI answers`
                        : "Waiting for the first check"}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-navy-400">
                    {w.active ? `Next check ${fmt(w.nextRunAt)}` : "Paused"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}

        {plan.limits.clients > 0 && canAdd && (
          <AddWatch
            maxQuestions={plan.limits.questions - usedQuestions}
            maxCompetitors={plan.limits.competitors}
            reports={reports}
            defaultReportId={reportParam && reports.some((r) => r.id === reportParam) ? reportParam : null}
          />
        )}
        {plan.limits.clients > 0 && !canAdd && (
          <p className="text-sm text-navy-500">
            You are using all of your plan&rsquo;s tracking allowance. <Link href="/pricing" className="underline">Upgrade</Link> to track more.
          </p>
        )}
      </div>
    </PageShell>
  );
}
