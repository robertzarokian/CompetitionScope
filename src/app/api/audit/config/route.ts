import { NextResponse } from "next/server";
import { enabledProviders } from "@/lib/audit/providers";
import { backlinksEnabled } from "@/lib/audit/backlinks";

// Read at request time: which checks are switched on depends on which API keys
// the site owner has added.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    providers: enabledProviders().map((p) => ({ id: p.id, label: p.label })),
    backlinks: backlinksEnabled(),
  });
}
