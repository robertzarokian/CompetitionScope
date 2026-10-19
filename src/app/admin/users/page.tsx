import type { Metadata } from "next";
import Link from "next/link";
import { AdminShell, Card, fmtDate } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { ensureTables, pool } from "@/lib/tables";

export const metadata: Metadata = { title: "Admin: accounts", robots: { index: false, follow: false } };

export default async function UsersPage({ searchParams }: PageProps<"/admin/users">) {
  const admin = await requireAdmin();
  await ensureTables();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const filter = typeof sp.plan === "string" ? sp.plan : "";

  const res = await pool().query(
    `SELECT u.id, u.email, u.created_at, s.plan, s.interval, s.status, s.current_period_end, s.cancel_at_period_end,
       (SELECT count(*)::int FROM reports r WHERE r.owner_user_id = u.id OR lower(r.data->'answers'->>'email') = lower(u.email)) AS reports,
       (SELECT count(*)::int FROM watches w WHERE w.user_id = u.id) AS watches
     FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id
     WHERE ($1 = '' OR u.email ILIKE '%' || $1 || '%')
       AND ($2 = '' OR ($2 = 'free' AND (s.plan IS NULL OR s.status NOT IN ('active','trialing','past_due'))) OR s.plan = $2)
     ORDER BY u.created_at DESC LIMIT 300`,
    [q, filter]
  );

  return (
    <AdminShell username={admin.username} title="Accounts">
      <form className="flex flex-wrap gap-3 text-sm">
        <input name="q" defaultValue={q} placeholder="Search by email" className="border border-navy-600 bg-cream-50 px-3 py-2" />
        <select name="plan" defaultValue={filter} className="border border-navy-600 bg-cream-50 px-3 py-2">
          <option value="">All plans</option>
          {["free", "starter", "growth", "agency"].map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button className="border border-navy-600 bg-navy-800 px-4 py-2 text-cream-50">Filter</button>
        <a href="/api/admin/export?type=users" className="px-2 py-2 text-brass-600 underline">Download CSV</a>
      </form>
      <Card title={`${res.rows.length} accounts`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-600 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-400">
                <th className="py-2 pr-3 font-normal">Email</th>
                <th className="py-2 pr-3 font-normal">Signed up</th>
                <th className="py-2 pr-3 font-normal">Plan</th>
                <th className="py-2 pr-3 font-normal">Status</th>
                <th className="py-2 pr-3 font-normal">Renews / ends</th>
                <th className="py-2 pr-3 font-normal">Reports</th>
                <th className="py-2 font-normal">Tracked</th>
              </tr>
            </thead>
            <tbody>
              {res.rows.map((r) => (
                <tr key={r.id} className="border-b border-navy-300/60">
                  <td className="py-2 pr-3"><Link href={`/admin/users/${r.id}`} className="font-medium text-brass-600 underline">{r.email}</Link></td>
                  <td className="py-2 pr-3 text-navy-600">{fmtDate(r.created_at)}</td>
                  <td className="py-2 pr-3 text-navy-800">{r.plan ?? "free"}{r.interval === "year" ? " (yearly)" : ""}</td>
                  <td className="py-2 pr-3 text-navy-600">{r.status ?? "none"}{r.cancel_at_period_end ? " (cancelling)" : ""}</td>
                  <td className="py-2 pr-3 text-navy-600">{fmtDate(r.current_period_end)}</td>
                  <td className="py-2 pr-3 text-navy-600">{r.reports}</td>
                  <td className="py-2 text-navy-600">{r.watches}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
