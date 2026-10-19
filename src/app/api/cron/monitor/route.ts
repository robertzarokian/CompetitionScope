import { after, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { runCycle } from "@/lib/monitor/cycle";

export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

// Called once a day by Vercel Cron (see vercel.json), and by itself to
// continue a large batch. It answers at once and does the work afterwards.
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Monitoring is not configured (CRON_SECRET is missing)." }, { status: 503 });
  }
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const depth = Number(url.searchParams.get("depth")) || 0;
  after(() => runCycle({ origin: url.origin, depth, startDue: depth === 0 }));
  return NextResponse.json({ ok: true, depth });
}
