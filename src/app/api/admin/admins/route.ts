import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdmin, getAdmin, logAdmin, sameOrigin, setAdminPassword, validateNewAdmin } from "@/lib/admin";
import { pool } from "@/lib/tables";

const createSchema = z.object({ username: z.string().trim(), password: z.string() });
const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("disable"), id: z.string() }),
  z.object({ action: z.literal("enable"), id: z.string() }),
  z.object({ action: z.literal("password"), id: z.string(), password: z.string() }),
]);

async function guard(request: Request) {
  if (!sameOrigin(request)) return { error: NextResponse.json({ error: "Invalid request." }, { status: 403 }) };
  const admin = await getAdmin();
  if (!admin) return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  return { admin };
}

export async function POST(request: Request) {
  const g = await guard(request);
  if (g.error) return g.error;
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const problem = validateNewAdmin(parsed.data.username, parsed.data.password);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  try {
    const created = await createAdmin(parsed.data.username, parsed.data.password, g.admin!.username);
    await logAdmin(g.admin!, "create_admin", created.username);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    console.error("[admin] create failed:", err);
    return NextResponse.json({ error: "Could not create the admin." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const g = await guard(request);
  if (g.error) return g.error;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = parsed.data;

  const target = (await pool().query("SELECT id, username, disabled FROM admins WHERE id = $1", [body.id])).rows[0];
  if (!target) return NextResponse.json({ error: "Admin not found." }, { status: 404 });

  if (body.action === "password") {
    const problem = validateNewAdmin(target.username, body.password);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    await setAdminPassword(target.id, body.password);
    await logAdmin(g.admin!, "reset_admin_password", target.username);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "disable") {
    if (target.id === g.admin!.id) return NextResponse.json({ error: "You cannot disable your own account." }, { status: 400 });
    const active = (await pool().query("SELECT count(*)::int AS n FROM admins WHERE NOT disabled")).rows[0].n;
    if (active <= 1) return NextResponse.json({ error: "There must always be one active admin." }, { status: 400 });
    await pool().query("UPDATE admins SET disabled = true WHERE id = $1", [target.id]);
    await pool().query("DELETE FROM admin_sessions WHERE admin_id = $1", [target.id]);
  } else {
    await pool().query("UPDATE admins SET disabled = false WHERE id = $1", [target.id]);
  }
  await logAdmin(g.admin!, `${body.action}_admin`, target.username);
  return NextResponse.json({ ok: true });
}
