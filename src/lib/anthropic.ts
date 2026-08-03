import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { CompetitionScopeReport, OnboardingAnswers } from "./types";
import { generateMockReport } from "./mockReport";

const MODEL = "claude-opus-5";

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

const competitorSchema = z.object({
  name: z.string(),
  website: z.string(),
  matchScore: z.number().min(0).max(100),
  ranking: z.number().int().min(1),
  summary: z.string(),
  estimatedSalesTier: z.string(),
  salesStrategy: z.string(),
  advertisingChannels: z.array(z.string()).min(1),
  strengths: z.array(z.string()).min(1),
  successFactors: z.array(z.string()).min(1),
});

const reportSchema = z.object({
  executiveSummary: z.string(),
  competitors: z.array(competitorSchema).min(2),
  successFactors: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        competitorsSharingIt: z.number().int().min(1),
      })
    )
    .min(3),
  roadmap: z
    .array(
      z.object({
        priority: z.number().int().min(1),
        title: z.string(),
        description: z.string(),
        impact: z.enum(["high", "medium", "low"]),
        effort: z.enum(["low", "medium", "high"]),
      })
    )
    .min(3),
  freeTeaserInsight: z.string(),
});

const SYSTEM_PROMPT = `You are the deep-research engine behind CompetitionScope, a paid competitor-intelligence service. A business owner has given you details about their company. Your job is to use web search extensively to find their real, closest, most successful competitors, analyze what those competitors are doing that works, and produce a prioritized action plan.

Research standards:
- Work efficiently. 2 well-chosen, distinct search queries is normally enough to identify 3-5 real, closest competitors — don't run more searches than you need to reach a confident answer.
- Look into each competitor's positioning, pricing/packaging, marketing channels, apparent scale, and what they emphasize publicly (site copy, reviews, press, job postings, ad presence) to infer their sales and growth strategy.
- Do not fabricate specific non-public financial figures. When exact revenue is not publicly known, give a labeled estimate range (e.g. "$10M-$25M ARR (estimated)") based on reasonable signals like headcount, funding, or market position, and make clear it is an estimate.
- Prefer real, verifiable companies found via search over speculation. If you cannot find enough real competitors, use the closest real analogues you can find rather than inventing companies.
- Ground the analysis directly in the specific struggles and context the user described — do not give generic advice that would apply to any company.

Output format:
Return ONLY a single valid JSON object. No markdown code fences, no prose before or after it, no trailing commentary, and no inline citation markup of any kind (no <cite> tags or similar annotations) — state findings as plain prose. The JSON must match exactly this shape:

{
  "executiveSummary": string (2 sentences, references the user's company and specific struggles by name),
  "competitors": [
    {
      "name": string,
      "website": string (root domain URL),
      "matchScore": number (0-100, how close a competitive match this is),
      "ranking": number (1 = strongest performer among the competitors listed),
      "summary": string (1-2 sentences on who they are and why they're relevant),
      "estimatedSalesTier": string (labeled estimate, e.g. "$10M-$25M ARR (estimated)"),
      "salesStrategy": string (1-2 sentences characterizing their go-to-market and sales approach),
      "advertisingChannels": string[] (exactly 3 channels they visibly use),
      "strengths": string[] (exactly 3 concrete strengths),
      "successFactors": string[] (exactly 2 specific things driving their success)
    }
  ],
  "successFactors": [
    {
      "title": string (short, punchy),
      "description": string (1-2 sentences, specific, referencing patterns across the competitors),
      "competitorsSharingIt": number (how many of the listed competitors show this trait)
    }
  ],
  "roadmap": [
    {
      "priority": number (1 = do first),
      "title": string (short, action-oriented),
      "description": string (2 sentences, concrete and specific to this company's situation),
      "impact": "high" | "medium" | "low",
      "effort": "low" | "medium" | "high"
    }
  ],
  "freeTeaserInsight": string (one enticing sentence, written like paywall marketing copy, that previews the single most compelling finding without giving it fully away — used to entice someone to unlock the full paid report)
}

Provide exactly 3 competitors, 3 successFactors ordered by how much they drive competitor success, and 3 roadmap items ordered by priority. Keep every field to the exact length specified above — do not pad with extra sentences, extra list items, or inline citations.`;

function buildUserPrompt(answers: OnboardingAnswers): string {
  return `Company name: ${answers.companyName}
Website: ${answers.website}
Category: ${answers.category}
What they provide: ${answers.description}
Their stated struggles: ${answers.struggles}
Self-reported sales confidence: ${answers.salesConfidence}
Self-reported performance-vs-potential gap: ${answers.potentialGap}
Competitors they already know of (may be empty): ${answers.knownCompetitors || "(none provided)"}
Marketing channels they currently use: ${answers.marketingChannels.join(", ") || "(none provided)"}

Research this company's real competitors on the web and produce the full CompetitionScope JSON report described in your instructions.`;
}

function extractJson(text: string): unknown {
  // Claude's web-search tool sometimes emits inline citation markup like
  // <cite index="9-1,9-2">...</cite> around researched claims, despite the
  // "no citation markup" instruction, and the quotes inside the tag's
  // attribute are inconsistently escaped relative to the surrounding JSON
  // string — sometimes \" (valid), sometimes a bare " (which prematurely
  // terminates the JSON string and corrupts everything after it). Stripping
  // the tags outright — both open and close — before any parse attempt
  // sidesteps this regardless of how the model escapes them.
  const withoutCitations = text.replace(/<\/?cite[^>]*>/gi, "");
  const trimmed = withoutCitations.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // fall through
    }
  }
  // Scan for a balanced {...} block via brace-depth tracking, robust to
  // leading and/or trailing prose the model may add despite the "no prose"
  // instruction (more common at lower effort levels) — unlike a naive
  // lastIndexOf("}"), this can't be thrown off by braces in trailing text
  // or by braces that happen to appear inside string values.
  const firstBrace = trimmed.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    for (let i = firstBrace; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (ch === "\\") {
        escapeNext = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") {
        depth++;
      } else if (ch === "}") {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(firstBrace, i + 1));
          } catch {
            break;
          }
        }
      }
    }
  }
  throw new Error("Could not extract JSON from model response");
}

export async function generateReport(
  answers: OnboardingAnswers,
  ownerUserId: string | null
): Promise<CompetitionScopeReport> {
  const client = getClient();
  if (!client) {
    return generateMockReport(answers, ownerUserId);
  }

  try {
    let messages: Anthropic.MessageParam[] = [
      { role: "user", content: buildUserPrompt(answers) },
    ];
    let finalText = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        // Opus 5 defaults to effort "high" with thinking on when neither is
        // set — that combination was taking ~5 minutes per report. Lower
        // effort plus a tighter search budget cuts this dramatically while
        // keeping real web-researched output (see the research-standards
        // prompt change above, which matches this lower max_uses).
        // (Explicitly disabling thinking was tried and measured worse —
        // higher and more variable latency, likely from less efficient
        // search planning — so adaptive thinking at low effort is kept.)
        output_config: { effort: "low" },
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: 2,
          },
        ],
        messages,
      });
      const message = await stream.finalMessage();

      if (message.stop_reason === "refusal") {
        throw new Error("Model declined the research request");
      }

      const textBlocks = message.content.filter(
        (b): b is Anthropic.TextBlock => b.type === "text"
      );
      finalText = textBlocks.map((b) => b.text).join("\n");

      if (message.stop_reason === "pause_turn") {
        messages = [...messages, { role: "assistant", content: message.content }];
        continue;
      }
      if (process.env.DEBUG_REPORT_GEN) {
        console.error("DEBUG stop_reason:", message.stop_reason);
        console.error("DEBUG finalText:", finalText);
      }
      break;
    }

    const parsedJson = extractJson(finalText);
    const parsed = reportSchema.parse(parsedJson);

    const competitors = [...parsed.competitors].sort((a, b) => a.ranking - b.ranking);

    return {
      id: randomUUID(),
      ownerUserId,
      createdAt: new Date().toISOString(),
      status: "ready",
      unlocked: false,
      source: "ai",
      answers,
      executiveSummary: parsed.executiveSummary,
      competitors,
      successFactors: parsed.successFactors,
      roadmap: [...parsed.roadmap].sort((a, b) => a.priority - b.priority),
      freeTeaserInsight: parsed.freeTeaserInsight,
    };
  } catch (err) {
    console.error(
      "[CompetitionScope] Claude report generation failed, falling back to sample report:",
      err
    );
    return generateMockReport(answers, ownerUserId);
  }
}
