import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell, Card, fmtDate } from "@/components/admin/AdminShell";
import { ReportAnswers } from "@/components/admin/Answers";
import { PlanSelect } from "@/components/admin/AdminClient";
import { requireAdmin } from "@/lib/admin";
import { getSubscription, planFromSubscription } from "@/lib/account";
import { ensureTables, pool } from "@/lib/tables";

export const metadata: Metadata = { title: "Admin: account", robots: { index: false, follow: false } };

export default async function UserPage({ params }: PageProps<"/admin/users/[id]">) {
  const admin = await requireAdmin();
  await ensureTables();
  const { id } = await params;
  const user = (await pool().query("SELECT id, email, created_at FROM users WHERE id = $1", [id])).rows[0];
  if (!user) notFound();

  const sub = await getSubscription(id);
  const plan = planFromSubscription(sub);
  const reports = (
    await pool().query(
      `SELECT id, created_at, source, unlocked, data FROM reports
       WHERE owner_user_id = $1 OR lower(data->'answers'->>'email') = lower($2) ORDER BY created_at DESC`,
      [id, user.email]
    )
  ).rows;
  const watches = (await pool().query("SELECT id, name, active, next_run_at FROM watches WHERE user_id = $1", [id])).rows;
  const alerts = (await pool().query("SELECT title, body, created_at FROM alerts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10", [id])).rows;
  const profile = (await pool().query("SELECT free_audits_used, email_alerts, brand_name FROM profiles WHERE user_id = $1", [id])).rows[0];

  return (
    <AdminShell username={admin.username} title={user.email}>
      <Link href="/admin/users" className="font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600">Back to accounts</Link>

      <Card title="Account">
        <dl className="grid gap-2 text-sm sm:grid-cols-[180px_1fr]">
          <dt className="text-navy-400">Signed up</dt><dd>{fmtDate(user.created_at)}</dd>
          <dt className="text-navy-400">Effective plan</dt><dd className="font-medium">{plan.name}</dd>
          <dt className="text-navy-400">Subscription status</dt><dd>{sub ? `${sub.status}${sub.cancelAtPeriodEnd ? " (cancelling at period end)" : ""}` : "none"}</dd>
          <dt className="text-navy-400">Billing</dt><dd>{sub ? (sub.interval === "year" ? "Yearly" : "Monthly") : "n/a"}</dd>
          <dt className="text-navy-400">Period ends</dt><dd>{fmtDate(sub?.currentPeriodEnd)}</dd>
          <dt className="text-navy-400">Stripe customer</dt><dd className="break-all font-mono text-xs">{sub?.stripeCustomerId ?? "none"}</dd>
          <dt className="text-navy-400">Free audits used</dt><dd>{profile?.free_audits_used ?? 0}</dd>
          <dt className="text-navy-400">Email alerts</dt><dd>{profile?.email_alerts === false ? "Off" : "On"}</dd>
          <dt className="text-navy-400">White-label brand</dt><dd>{profile?.brand_name ?? "none"}</dd>
        </dl>
        <div className="mt-5 border-t border-navy-300/60 pt-4">
          <p className="mb-2 text-sm font-medium text-navy-800">Set plan by hand</p>
          <PlanSelect userId={id} plan={plan.id} />
        </div>
      </Card>

      <Card title={`Questionnaire responses (${reports.length})`}>
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportAnswers
              key={r.id}
              id={r.id}
              createdAt={r.created_at}
              source={r.source}
              unlocked={r.unlocked}
              answers={r.data.answers ?? {}}
              competitors={(r.data.competitors ?? []).map((c: { name: string }) => c.name)}
            />
          ))}
          {reports.length === 0 && <p className="text-sm text-navy-400">No reports yet.</p>}
        </div>
      </Card>

      <Card title={`Tracked companies (${watches.length})`}>
        <ul className="space-y-1 text-sm">
          {watches.map((w) => (
            <li key={w.id}>{w.name} <span className="text-navy-400">{w.active ? `next check ${fmtDate(w.next_run_at)}` : "paused"}</span></li>
          ))}
          {watches.length === 0 && <li className="text-navy-400">None.</li>}
        </ul>
      </Card>

      {alerts.length > 0 && (
        <Card title="Recent alerts sent">
          <ul className="space-y-2 text-sm">
            {alerts.map((a, i) => (
              <li key={i}><span className="font-medium">{a.title}</span> <span className="text-navy-400">{fmtDate(a.created_at)}</span><br /><span className="text-navy-500">{a.body}</span></li>
            ))}
          </ul>
        </Card>
      )}
    </AdminShell>
  );
}
