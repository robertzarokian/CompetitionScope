import { NextResponse } from "next/server";
import { getAdmin, logAdmin } from "@/lib/admin";
import { pool } from "@/lib/tables";

// Spreadsheet programs run text that starts with = + - or @ as a formula, so
// those cells get a leading apostrophe.
const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};
const csv = (rows: unknown[][]) => rows.map((r) => r.map(cell).join(",")).join("\r\n");

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const type = new URL(request.url).searchParams.get("type");

  let body = "";
  if (type === "users") {
    const res = await pool().query(`
      SELECT u.email, u.created_at, s.plan, s.interval, s.status, s.current_period_end,
        (SELECT count(*) FROM reports r WHERE r.owner_user_id = u.id) AS reports
      FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id ORDER BY u.created_at DESC`);
    body = csv([
      ["Email", "Signed up", "Plan", "Billing", "Status", "Period ends", "Reports"],
      ...res.rows.map((r) => [r.email, r.created_at?.toISOString(), r.plan ?? "free", r.interval, r.status, r.current_period_end?.toISOString(), r.reports]),
    ]);
  } else if (type === "responses") {
    const res = await pool().query("SELECT id, created_at, source, unlocked, data FROM reports ORDER BY created_at DESC");
    body = csv([
      ["Report id", "Created", "Source", "Paid unlock", "Email", "Company", "Website", "Category", "What they provide", "Struggles", "Sales confidence", "Potential gap", "Known competitors", "Marketing channels"],
      ...res.rows.map((r) => {
        const a = r.data?.answers ?? {};
        return [r.id, r.created_at?.toISOString(), r.source, r.unlocked, a.email, a.companyName, a.website, a.category, a.description, a.struggles, a.salesConfidence, a.potentialGap, a.knownCompetitors, (a.marketingChannels ?? []).join("; ")];
      }),
    ]);
  } else if (type === "leads") {
    const res = await pool().query("SELECT email, code, emailed, created_at, expires_at FROM promo_signups ORDER BY created_at DESC");
    body = csv([
      ["Email", "Code", "Code emailed", "Signed up", "Code expires"],
      ...res.rows.map((r) => [r.email, r.code, r.emailed, r.created_at?.toISOString(), r.expires_at?.toISOString()]),
    ]);
  } else {
    return NextResponse.json({ error: "Unknown export." }, { status: 400 });
  }

  await logAdmin(admin, "export", type);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="competitionscope-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
