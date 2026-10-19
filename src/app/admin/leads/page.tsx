import type { Metadata } from "next";
import { AdminShell, Card, fmtDate } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { ensureTables, pool } from "@/lib/tables";

export const metadata: Metadata = { title: "Admin: discount signups", robots: { index: false, follow: false } };

export default async function LeadsPage() {
  const admin = await requireAdmin();
  await ensureTables();
  const rows = (await pool().query("SELECT email, code, emailed, created_at, expires_at FROM promo_signups ORDER BY created_at DESC LIMIT 500")).rows;
  return (
    <AdminShell username={admin.username} title="Discount signups">
      <Card title={`${rows.length} people signed up through the popup`}>
        <p className="mb-3 text-sm text-navy-500">
          Only visitors who use the welcome popup get a code. Each code is single use and takes 25% off the first month. To see
          which codes were used, open Stripe, then Product catalog, then Coupons.
        </p>
        <a href="/api/admin/export?type=leads" className="text-sm text-brass-600 underline">Download as CSV</a>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-300/60 font-mono text-[10px] uppercase tracking-[0.14em] text-navy-400">
                <th className="py-2 pr-3 font-normal">Email</th>
                <th className="px-3 py-2 font-normal">Code</th>
                <th className="px-3 py-2 font-normal">Emailed</th>
                <th className="px-3 py-2 font-normal">Signed up</th>
                <th className="py-2 pl-3 font-normal">Expires</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} className="border-b border-navy-300/40">
                  <td className="py-2 pr-3 text-navy-800">{r.email}</td>
                  <td className="px-3 py-2 font-mono text-xs text-navy-700">{r.code}</td>
                  <td className="px-3 py-2 text-navy-600">{r.emailed ? "Yes" : "No"}</td>
                  <td className="px-3 py-2 text-navy-500">{fmtDate(r.created_at)}</td>
                  <td className="py-2 pl-3 text-navy-500">{fmtDate(r.expires_at)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-navy-400">No signups yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
