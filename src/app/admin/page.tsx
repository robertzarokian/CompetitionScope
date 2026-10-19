import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell, Card } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { PLANS, formatPrice } from "@/lib/plans";
import { ensureTables, pool } from "@/lib/tables";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const ACTIVE = "('active','trialing','past_due')";

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="paper-panel border border-navy-600 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-navy-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-navy-800">{value}</p>
      {sub && <p className="text-xs text-navy-500">{sub}</p>}
    </div>
  );
}

export default async function AdminHome() {
  const admin = await requireAdmin();
  await ensureTables();
  const q = async (sql: string) => (await pool().query(sql)).rows;

  const [users] = await q(`SELECT count(*)::int AS total,
    count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS week,
    count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS month FROM users`);
  const [reports] = await q(`SELECT count(*)::int AS total,
    count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS week,
    count(*) FILTER (WHERE owner_user_id IS NULL)::int AS anonymous FROM reports`);
  const subs = await q(`SELECT plan, interval, status FROM subscriptions WHERE status IN ${ACTIVE}`);
  const [watch] = await q(`SELECT (SELECT count(*) FROM watches)::int AS watches,
    (SELECT count(*) FROM watch_runs WHERE status = 'running')::int AS running`);

  const byPlan: Record<string, number> = {};
  let mrr = 0;
  for (const s of subs) {
    byPlan[s.plan] = (byPlan[s.plan] ?? 0) + 1;
    const plan = PLANS[s.plan as keyof typeof PLANS];
    if (plan) mrr += s.interval === "year" ? plan.annualCents / 12 : plan.monthlyCents;
  }

  // Which services are switched on. Values are never shown, only whether they exist.
  const e = process.env;
  const checks: [string, boolean, string][] = [
    ["Stripe secret key", !!e.STRIPE_SECRET_KEY, "Needed to take payments"],
    ["Stripe webhook secret", !!e.STRIPE_WEBHOOK_SECRET, "Optional, speeds up plan updates"],
    ["Anthropic key", !!e.ANTHROPIC_API_KEY, "Needed for reports and audits"],
    ["Login signing secret (AUTH_SECRET)", !!e.AUTH_SECRET, "Customer logins are insecure without it"],
    ["Cron secret", !!e.CRON_SECRET, "Needed for scheduled monitoring"],
    ["Email (Resend)", !!(e.RESEND_API_KEY && e.ALERT_FROM_EMAIL), "Optional, for emailed alerts"],
    ["Backlinks (DataForSEO)", !!(e.DATAFORSEO_LOGIN && e.DATAFORSEO_PASSWORD), "Optional"],
    ["Speed test key", !!e.GOOGLE_PAGESPEED_API_KEY, "Optional, avoids Google's busy message"],
    ["ChatGPT key", !!e.OPENAI_API_KEY, "Optional"],
    ["Perplexity key", !!e.PERPLEXITY_API_KEY, "Optional"],
    ["Gemini key", !!e.GEMINI_API_KEY, "Optional"],
    ["Grok key", !!e.XAI_API_KEY, "Optional"],
  ];

  return (
    <AdminShell username={admin.username} title="Overview">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Accounts" value={users.total} sub={`${users.week} this week, ${users.month} this month`} />
        <Stat label="Paying" value={subs.length} sub={Object.entries(byPlan).map(([p, n]) => `${n} ${p}`).join(", ") || "None yet"} />
        <Stat label="Monthly revenue" value={formatPrice(Math.round(mrr))} sub="From active subscriptions" />
        <Stat label="Reports" value={reports.total} sub={`${reports.week} this week, ${reports.anonymous} without an account`} />
        <Stat label="Tracked companies" value={watch.watches} sub={`${watch.running} checks running now`} />
      </div>

      <Card title="Quick links">
        <div className="flex flex-wrap gap-5 text-sm">
          <Link href="/admin/users" className="text-brass-600 underline">All accounts</Link>
          <Link href="/admin/reports" className="text-brass-600 underline">All questionnaire responses</Link>
          <a href="/api/admin/export?type=users" className="text-brass-600 underline">Download accounts (CSV)</a>
          <a href="/api/admin/export?type=responses" className="text-brass-600 underline">Download responses (CSV)</a>
        </div>
      </Card>

      <Card title="System health">
        <ul className="divide-y divide-navy-300/60 text-sm">
          {checks.map(([name, ok, why]) => (
            <li key={name} className="flex items-center justify-between gap-4 py-2">
              <span className="text-navy-800">{name} <span className="text-xs text-navy-400">{why}</span></span>
              <span className={`font-mono text-[11px] uppercase ${ok ? "text-emerald-700" : "text-brass-600"}`}>{ok ? "Set" : "Missing"}</span>
            </li>
          ))}
        </ul>
      </Card>
    </AdminShell>
  );
}
