import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CompetitionScopeReport } from "./types";

const PAGE_WIDTH = 612; // US Letter
const PAGE_HEIGHT = 792;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const GOLD = rgb(0.8, 0.624, 0.322); // #cc9f52 — brass-400
const GOLD_DARK = rgb(0.49, 0.361, 0.164); // #7d5b2a — brass-600, for text on paper
const INK = rgb(0.08, 0.09, 0.12);
const MUTED = rgb(0.42, 0.44, 0.5);
const PAPER = rgb(0.957, 0.925, 0.847); // #f4ecd8 — cream-100
const PAPER_LIGHT = rgb(0.984, 0.965, 0.914); // #fbf6e9 — cream-50

interface Cursor {
  page: PDFPage;
  y: number;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// "brand" lets agency customers put their own name on the PDF instead of ours.
export async function generateReportPdf(
  report: CompetitionScopeReport,
  brand = "CompetitionScope"
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${report.answers.companyName}: ${brand} Report`);
  doc.setAuthor(brand);
  doc.setProducer(brand);

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const pages: PDFPage[] = [];

  function newPage(): PDFPage {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    return page;
  }

  function drawFooter(page: PDFPage, index: number) {
    page.drawLine({
      start: { x: MARGIN, y: 46 },
      end: { x: PAGE_WIDTH - MARGIN, y: 46 },
      thickness: 0.75,
      color: rgb(0.85, 0.85, 0.88),
    });
    page.drawText(brand, {
      x: MARGIN,
      y: 32,
      size: 8,
      font: bold,
      color: MUTED,
    });
    page.drawText(`Page ${index}`, {
      x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(`Page ${index}`, 8),
      y: 32,
      size: 8,
      font: regular,
      color: MUTED,
    });
  }

  function startContentPage(): Cursor {
    const page = newPage();
    page.drawText(brand, {
      x: MARGIN,
      y: PAGE_HEIGHT - 50,
      size: 11,
      font: bold,
      color: GOLD,
    });
    return { page, y: PAGE_HEIGHT - 90 };
  }

  // Assigned before use (right before the Executive Summary section, after
  // the cover page is created) — definite-assignment asserted since that
  // assignment happens outside the closures below.
  let cursor!: Cursor;

  function ensureSpace(linesHeight: number) {
    if (cursor.y - linesHeight < 70) {
      cursor = startContentPage();
    }
  }

  function heading(text: string, size = 17) {
    ensureSpace(size + 26);
    cursor.y -= 6;
    cursor.page.drawText(text, {
      x: MARGIN,
      y: cursor.y,
      size,
      font: bold,
      color: INK,
    });
    cursor.y -= 8;
    cursor.page.drawLine({
      start: { x: MARGIN, y: cursor.y },
      end: { x: MARGIN + 46, y: cursor.y },
      thickness: 2.5,
      color: GOLD,
    });
    cursor.y -= 18;
  }

  function subheading(text: string, size = 12.5) {
    ensureSpace(size + 14);
    cursor.page.drawText(text, {
      x: MARGIN,
      y: cursor.y,
      size,
      font: bold,
      color: INK,
    });
    cursor.y -= size + 8;
  }

  function paragraph(text: string, opts?: { size?: number; color?: ReturnType<typeof rgb>; font?: PDFFont; indent?: number }) {
    const size = opts?.size ?? 10.5;
    const font = opts?.font ?? regular;
    const color = opts?.color ?? rgb(0.15, 0.17, 0.22);
    const indent = opts?.indent ?? 0;
    const lines = wrapText(text, font, size, CONTENT_WIDTH - indent);
    for (const line of lines) {
      ensureSpace(size + 6);
      cursor.page.drawText(line, {
        x: MARGIN + indent,
        y: cursor.y,
        size,
        font,
        color,
      });
      cursor.y -= size + 5.5;
    }
    cursor.y -= 4;
  }

  function bulletList(items: string[]) {
    for (const item of items) {
      const size = 10.2;
      const lines = wrapText(item, regular, size, CONTENT_WIDTH - 16);
      ensureSpace(size + 6);
      cursor.page.drawCircle({
        x: MARGIN + 3,
        y: cursor.y + 3.2,
        size: 1.6,
        color: GOLD,
      });
      lines.forEach((line, i) => {
        ensureSpace(size + 6);
        cursor.page.drawText(line, {
          x: MARGIN + 14,
          y: cursor.y,
          size,
          font: regular,
          color: rgb(0.15, 0.17, 0.22),
        });
        cursor.y -= size + 4.5;
        if (i < lines.length - 1) ensureSpace(size + 6);
      });
    }
    cursor.y -= 4;
  }

  function spacer(h = 10) {
    cursor.y -= h;
  }

  // ---------- Cover page ----------
  const cover = newPage();
  cover.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: PAPER });
  cover.drawRectangle({ x: 0, y: PAGE_HEIGHT - 260, width: PAGE_WIDTH, height: 260, color: PAPER_LIGHT });
  cover.drawLine({
    start: { x: 0, y: PAGE_HEIGHT - 260 },
    end: { x: PAGE_WIDTH, y: PAGE_HEIGHT - 260 },
    thickness: 1.5,
    color: GOLD,
  });

  // Corner brackets — viewfinder motif, echoed from the site's instrument framing
  const bracket = 16;
  const corners: [number, number, number, number][] = [
    [MARGIN - 14, PAGE_HEIGHT - 14, 1, -1],
    [PAGE_WIDTH - MARGIN + 14, PAGE_HEIGHT - 14, -1, -1],
    [MARGIN - 14, 14, 1, 1],
    [PAGE_WIDTH - MARGIN + 14, 14, -1, 1],
  ];
  for (const [x, y, dx, dy] of corners) {
    cover.drawLine({ start: { x, y }, end: { x: x + bracket * dx, y }, thickness: 1, color: GOLD });
    cover.drawLine({ start: { x, y }, end: { x, y: y + bracket * dy }, thickness: 1, color: GOLD });
  }

  // Telescope lens mark (simple concentric circles)
  const lensX = MARGIN + 26;
  const lensY = PAGE_HEIGHT - 150;
  cover.drawCircle({ x: lensX, y: lensY, size: 22, borderColor: GOLD_DARK, borderWidth: 2 });
  cover.drawCircle({ x: lensX, y: lensY, size: 13, borderColor: GOLD_DARK, borderWidth: 1.5 });
  cover.drawCircle({ x: lensX, y: lensY, size: 4, color: GOLD });

  cover.drawText(brand, {
    x: lensX + 42,
    y: lensY - 8,
    size: 26,
    font: bold,
    color: INK,
  });

  cover.drawText("COMPETITOR INTELLIGENCE REPORT", {
    x: MARGIN,
    y: PAGE_HEIGHT - 340,
    size: 11,
    font: bold,
    color: GOLD_DARK,
  });

  const titleLines = wrapText(report.answers.companyName || "Your Company", bold, 30, CONTENT_WIDTH);
  let titleY = PAGE_HEIGHT - 380;
  for (const line of titleLines) {
    cover.drawText(line, { x: MARGIN, y: titleY, size: 30, font: bold, color: INK });
    titleY -= 36;
  }

  cover.drawText(
    `Prepared ${new Date(report.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`,
    { x: MARGIN, y: titleY - 6, size: 11, font: regular, color: GOLD_DARK }
  );

  cover.drawText(
    `Category: ${report.answers.category || "Not specified"}`,
    { x: MARGIN, y: titleY - 26, size: 11, font: regular, color: MUTED }
  );

  const disclaimerLines = wrapText(
    report.source === "mock"
      ? "This is a sample report generated in demo mode without live web research. Configure ANTHROPIC_API_KEY to generate live, web-researched competitor reports."
      : "Competitor detail is generated from public web research and AI analysis. Financial figures are labeled estimates where exact numbers are not publicly available.",
    oblique,
    9,
    CONTENT_WIDTH
  );
  let discY = 90;
  for (const line of disclaimerLines) {
    cover.drawText(line, { x: MARGIN, y: discY, size: 9, font: oblique, color: rgb(0.5, 0.48, 0.44) });
    discY -= 12;
  }

  // ---------- Executive summary ----------
  cursor = startContentPage();
  heading("Executive Summary");
  paragraph(report.executiveSummary);
  spacer(6);
  subheading("What you told us");
  paragraph(`Struggles: ${report.answers.struggles}`, { size: 9.8, color: MUTED });
  paragraph(`Self-reported sales confidence: ${report.answers.salesConfidence}`, { size: 9.8, color: MUTED });
  paragraph(`Performance vs. potential: ${report.answers.potentialGap}`, { size: 9.8, color: MUTED });

  // ---------- Competitors ----------
  cursor = startContentPage();
  heading("Competitor Breakdown");
  report.competitors.forEach((c, idx) => {
    ensureSpace(90);
    subheading(`No. ${String(c.ranking).padStart(2, "0")}: ${c.name}  ·  ${c.matchScore}% match`);
    paragraph(c.website, { size: 9.5, color: MUTED, font: oblique });
    paragraph(c.summary);
    paragraph(`Estimated scale: ${c.estimatedSalesTier}`, { size: 10, font: bold });
    paragraph(`Sales strategy: ${c.salesStrategy}`);
    paragraph(`Advertising channels: ${c.advertisingChannels.join(", ")}`, { size: 10 });
    subheading("Strengths", 10.5);
    bulletList(c.strengths);
    subheading("Why they're succeeding", 10.5);
    bulletList(c.successFactors);
    if (idx < report.competitors.length - 1) {
      spacer(6);
      ensureSpace(20);
      cursor.page.drawLine({
        start: { x: MARGIN, y: cursor.y },
        end: { x: PAGE_WIDTH - MARGIN, y: cursor.y },
        thickness: 0.5,
        color: rgb(0.88, 0.88, 0.9),
      });
      spacer(16);
    }
  });

  // ---------- Success factors ----------
  cursor = startContentPage();
  heading("What They All Have in Common");
  report.successFactors.forEach((f) => {
    ensureSpace(50);
    subheading(`${f.title}  ·  shared by ${f.competitorsSharingIt} competitor${f.competitorsSharingIt === 1 ? "" : "s"}`, 11.5);
    paragraph(f.description);
  });

  // ---------- Roadmap ----------
  cursor = startContentPage();
  heading("Your Roadmap to Outperform Them");
  report.roadmap
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .forEach((r) => {
      ensureSpace(70);
      subheading(`${r.priority}. ${r.title}`, 12);
      paragraph(`Impact: ${r.impact.toUpperCase()}   ·   Effort: ${r.effort.toUpperCase()}`, {
        size: 9,
        color: rgb(0.62, 0.47, 0.13),
        font: bold,
      });
      paragraph(r.description);
    });

  spacer(20);
  ensureSpace(40);
  cursor.page.drawRectangle({
    x: MARGIN,
    y: cursor.y - 30,
    width: CONTENT_WIDTH,
    height: 46,
    color: rgb(0.98, 0.95, 0.87),
  });
  paragraph(
    brand === "CompetitionScope"
      ? "Generated by CompetitionScope. Point it at your next competitor at competitionscope.com"
      : `Prepared by ${brand}`,
    { size: 9.5, font: bold, color: rgb(0.62, 0.47, 0.13) }
  );

  pages.forEach((p, i) => {
    if (i === 0) return; // skip cover
    drawFooter(p, i);
  });

  return doc.save();
}
