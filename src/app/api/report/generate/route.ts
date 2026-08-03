import { NextResponse } from "next/server";
import { z } from "zod";
import { updateDb } from "@/lib/db";
import { getUserIdFromSession } from "@/lib/auth";
import { generateReport } from "@/lib/anthropic";

// Claude report generation typically takes 50-65s (live web search +
// generation). Vercel's default function timeout (10-15s depending on plan)
// is well under that, so without this the request gets killed before Claude
// finishes, regardless of how fast the model call itself is.
export const maxDuration = 90;

const answersSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  website: z.string().trim().min(1).max(300),
  category: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(2000),
  struggles: z.string().trim().min(1).max(2000),
  salesConfidence: z.string().trim().min(1).max(60),
  potentialGap: z.string().trim().min(1).max(60),
  knownCompetitors: z.string().trim().max(1000).default(""),
  marketingChannels: z.array(z.string()).default([]),
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = answersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Missing or invalid answers." },
      { status: 400 }
    );
  }

  const ownerUserId = await getUserIdFromSession();
  const report = await generateReport(parsed.data, ownerUserId);

  await updateDb((db) => {
    db.reports.push(report);
  });

  return NextResponse.json({ reportId: report.id, source: report.source });
}
