import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getAdmin, logAdmin, sameOrigin, setAdminPassword, startAdminSession, validateNewAdmin } from "@/lib/admin";
import { pool } from "@/lib/tables";
import { consume } from "@/lib/rateLimit";

const bodySchema = z.object({ current: z.string().max(200), next: z.string().max(200) });

// Lets an admin change their own password (requires the current one).
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!(await consume("admin-pw", admin.id, 5, 900))) {
    return NextResponse.json({ error: "Too many attempts. Please wait and try again." }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const row = (await pool().query("SELECT password_hash FROM admins WHERE id = $1", [admin.id])).rows[0];
  if (!row || !(await bcrypt.compare(parsed.data.current, row.password_hash))) {
    return NextResponse.json({ error: "Your current password is not correct." }, { status: 400 });
  }
  const problem = validateNewAdmin(admin.username, parsed.data.next);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  await setAdminPassword(admin.id, parsed.data.next);
  await startAdminSession(admin.id); // stay signed in on this device
  await logAdmin(admin, "change_password");
  return NextResponse.json({ ok: true });
}
