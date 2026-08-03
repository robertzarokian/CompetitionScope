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
- Use the web_search tool as many times as needed (multiple distinct queries) to identify 3-5 real companies that are the closest, most relevant, and most successful competitors to the user's company, given their category, description, and any competitors they already named.
- Look into each competitor's positioning, pricing/packaging, marketing channels, apparent scale, and what they emphasize publicly (site copy, reviews, press, job postings, ad presence) to infer their sales and growth strategy.
- Do not fabricate specific non-public financial figures. When exact revenue is not publicly known, give a labeled estimate range (e.g. "$10M-$25M ARR (estimated)") based on reasonable signals like headcount, funding, or market position, and make clear it is an estimate.
- Prefer real, verifiable companies found via search over speculation. If you cannot find enough real competitors, use the closest real analogues you can find rather than inventing companies.
- Ground the analysis directly in the specific struggles and context the user described — do not give generic advice that would apply to any company.

Output format:
Return ONLY a single valid JSON object. No markdown code fences, no prose before or after it, no trailing commentary. The JSON must match exactly this shape:

{
  "executiveSummary": string (3-5 sentences, references the user's company and specific struggles by name),
  "competitors": [
    {
      "name": string,
      "website": string (root domain URL),
      "matchScore": number (0-100, how close a competitive match this is),
      "ranking": number (1 = strongest performer among the competitors listed),
      "summary": string (2-3 sentences on who they are and why they're relevant),
      "estimatedSalesTier": string (labeled estimate, e.g. "$10M-$25M ARR (estimated)"),
      "salesStrategy": string (2-3 sentences characterizing their go-to-market and sales approach),
      "advertisingChannels": string[] (channels they visibly use),
      "strengths": string[] (3-5 concrete strengths),
      "successFactors": string[] (2-4 specific things driving their success)
    }
  ],
  "successFactors": [
    {
      "title": string (short, punchy),
      "description": string (2-3 sentences, specific, referencing patterns across the competitors),
      "competitorsSharingIt": number (how many of the listed competitors show this trait)
    }
  ],
  "roadmap": [
    {
      "priority": number (1 = do first),
      "title": string (short, action-oriented),
      "description": string (2-4 sentences, concrete and specific to this company's situation),
      "impact": "high" | "medium" | "low",
      "effort": "low" | "medium" | "high"
    }
  ],
  "freeTeaserInsight": string (one enticing sentence, written like paywall marketing copy, that previews the single most compelling finding without giving it fully away — used to entice someone to unlock the full paid report)
}

Provide at least 3 competitors (ideally 4-5), at least 4 successFactors ordered by how much they drive competitor success, and at least 5 roadmap items ordered by priority.`;

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
  const trimmed = text.trim();
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
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {
      // fall through
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
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: 10,
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
