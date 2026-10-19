import type { Metadata } from "next";
import { AdminShell, Card, fmtDate } from "@/components/admin/AdminShell";
import { AdminManager } from "@/components/admin/AdminClient";
import { requireAdmin } from "@/lib/admin";
import { pool } from "@/lib/tables";

export const metadata: Metadata = { title: "Admin: admins", robots: { index: false, follow: false } };

export default async function AdminsPage() {
  const admin = await requireAdmin();
  const rows = (await pool().query("SELECT id, username, disabled, created_by, created_at FROM admins ORDER BY created_at")).rows;
  return (
    <AdminShell username={admin.username} title="Administrators">
      <Card title="Admin accounts">
        <AdminManager
          selfId={admin.id}
          admins={rows.map((r) => ({
            id: r.id,
            username: r.username,
            disabled: r.disabled,
            createdBy: r.created_by,
            createdAt: fmtDate(r.created_at),
          }))}
        />
      </Card>
    </AdminShell>
  );
}
