import type { Metadata } from "next";
import { AdminShell, Card } from "@/components/admin/AdminShell";
import { ReportAnswers } from "@/components/admin/Answers";
import { requireAdmin } from "@/lib/admin";
import { ensureTables, pool } from "@/lib/tables";

export const metadata: Metadata = { title: "Admin: responses", robots: { index: false, follow: false } };

export default async function ResponsesPage({ searchParams }: PageProps<"/admin/reports">) {
  const admin = await requireAdmin();
  await ensureTables();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const res = await pool().query(
    `SELECT id, created_at, source, unlocked, data FROM reports
     WHERE $1 = '' OR data->'answers'->>'email' ILIKE '%' || $1 || '%' OR data->'answers'->>'companyName' ILIKE '%' || $1 || '%'
     ORDER BY created_at DESC LIMIT 300`,
    [q]
  );
  return (
    <AdminShell username={admin.username} title="Questionnaire responses">
      <form className="flex flex-wrap gap-3 text-sm">
        <input name="q" defaultValue={q} placeholder="Search by email or company" className="border border-navy-600 bg-cream-50 px-3 py-2" />
        <button className="border border-navy-600 bg-navy-800 px-4 py-2 text-cream-50">Search</button>
        <a href="/api/admin/export?type=responses" className="px-2 py-2 text-brass-600 underline">Download CSV</a>
      </form>
      <Card title={`${res.rows.length} responses, newest first`}>
        <div className="space-y-3">
          {res.rows.map((r) => (
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
        </div>
      </Card>
    </AdminShell>
  );
}
