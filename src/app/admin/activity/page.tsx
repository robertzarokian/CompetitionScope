import type { Metadata } from "next";
import { AdminShell, Card, fmtDate } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin";
import { ensureTables, pool } from "@/lib/tables";

export const metadata: Metadata = { title: "Admin: activity", robots: { index: false, follow: false } };

export default async function ActivityPage() {
  const admin = await requireAdmin();
  await ensureTables();
  const rows = (await pool().query("SELECT admin_username, action, detail, created_at FROM admin_log ORDER BY created_at DESC LIMIT 200")).rows;
  return (
    <AdminShell username={admin.username} title="Admin activity">
      <Card title="Every admin action is recorded here">
        <ul className="divide-y divide-navy-300/60 text-sm">
          {rows.map((r, i) => (
            <li key={i} className="flex flex-wrap justify-between gap-3 py-2">
              <span><span className="font-medium text-navy-800">{r.admin_username}</span> <span className="text-navy-600">{r.action}</span> <span className="text-navy-500">{r.detail}</span></span>
              <span className="text-xs text-navy-400">{fmtDate(r.created_at)}</span>
            </li>
          ))}
          {rows.length === 0 && <li className="py-2 text-navy-400">Nothing yet.</li>}
        </ul>
      </Card>
    </AdminShell>
  );
}
