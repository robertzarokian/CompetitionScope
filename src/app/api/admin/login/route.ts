import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdmin, sameOrigin, startAdminSession, verifyAdminLogin } from "@/lib/admin";
import { clientIp, consume } from "@/lib/rateLimit";

const bodySchema = z.object({ username: z.string().trim().max(64), password: z.string().max(200) });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your username and password." }, { status: 400 });
  const { username, password } = parsed.data;

  // Slow down guessing: limited per visitor and per username.
  const ip = clientIp(request);
  const withinIp = await consume("admin-login-ip", ip, 10, 900);
  const withinUser = await consume("admin-login-user", username.toLowerCase(), 6, 900);
  if (!withinIp || !withinUser) {
    return NextResponse.json({ error: "Too many attempts. Please wait 15 minutes and try again." }, { status: 429 });
  }

  const admin = await verifyAdminLogin(username, password);
  if (!admin) return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });

  await startAdminSession(admin.id);
  await logAdmin(admin, "login");
  return NextResponse.json({ ok: true });
}
