import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { generateReportPdf } from "@/lib/pdf";

export async function GET(_request: Request, ctx: RouteContext<"/api/report/[id]/pdf">) {
  const { id } = await ctx.params;
  const db = await readDb();
  const report = db.reports.find((r) => r.id === id);

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
  if (!report.unlocked) {
    return NextResponse.json(
      { error: "This report hasn't been unlocked yet." },
      { status: 403 }
    );
  }

  const pdfBytes = await generateReportPdf(report);
  const fileName = `CompetitionScope-${(report.answers.companyName || "report")
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
