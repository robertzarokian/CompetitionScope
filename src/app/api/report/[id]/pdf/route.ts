import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { generateReportPdf } from "@/lib/pdf";
import { getUserIdFromSession } from "@/lib/auth";
import { getPlan, getProfile } from "@/lib/account";

export async function GET(_request: Request, ctx: RouteContext<"/api/report/[id]/pdf">) {
  const { id } = await ctx.params;
  const db = await readDb();
  const report = db.reports.find((r) => r.id === id);

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  // Reports bought before subscriptions keep their PDF; otherwise the PDF is a
  // Growth and Agency feature.
  const userId = await getUserIdFromSession();
  const plan = await getPlan(userId);
  if (!report.unlocked && !plan.limits.pdf) {
    return NextResponse.json(
      { error: "PDF reports are included with the Growth and Agency plans." },
      { status: 403 }
    );
  }

  // Agency customers can put their own brand on the PDF.
  let brand = "CompetitionScope";
  if (userId && plan.limits.whiteLabel) {
    const profile = await getProfile(userId);
    if (profile.brandName) brand = profile.brandName;
  }

  const pdfBytes = await generateReportPdf(report, brand);
  const fileName = `${brand === "CompetitionScope" ? "CompetitionScope" : "Report"}-${(report.answers.companyName || "report")
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
