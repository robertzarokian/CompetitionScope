import { NextResponse } from "next/server";
import { endAdminSession, sameOrigin } from "@/lib/admin";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request." }, { status: 403 });
  await endAdminSession();
  return NextResponse.json({ ok: true });
}
