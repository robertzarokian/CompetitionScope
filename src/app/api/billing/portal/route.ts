import { NextResponse } from "next/server";
import { getUserIdFromSession } from "@/lib/auth";
import { BillingError, createPortalUrl } from "@/lib/billing";

export async function POST(request: Request) {
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  try {
    const url = await createPortalUrl(userId, new URL(request.url).origin);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[billing] portal failed:", err);
    const message =
      err instanceof BillingError
        ? err.message
        : "The billing page could not be opened. Please contact support.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
