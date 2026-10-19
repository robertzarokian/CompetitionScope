import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPlan } from "@/lib/account";

// ?plan=1 also returns the plan, for pages that gate a feature by plan.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  const wantsPlan = new URL(request.url).searchParams.get("plan") === "1";
  const plan = user && wantsPlan ? (await getPlan(user.id)).id : undefined;
  return NextResponse.json({ user: user ? { id: user.id, email: user.email } : null, plan });
}
