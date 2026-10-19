import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { ProviderAnswer } from "./providers/types";

const MODEL = process.env.AUDIT_CLAUDE_MODEL || "claude-opus-5";

const extractionSchema = z.object({
  recommendations: z.array(
    z.object({
      name: z.string(),
      rank: z.number().int(),
      website: z.string().nullable(),
      sourceNumbers: z.array(z.number().int()),
    })
  ),
});

export type Extraction = z.infer<typeof extractionSchema>;

const SYSTEM = `You read an AI assistant's answer to a user's question and list the businesses or brands that the answer recommends or presents as options for that question.

Rules:
- Include only real businesses or brands named as options that answer the question. Leave out the user's own search terms, generic advice, and websites that are merely sources (review sites, directories, news sites) unless the question asks for them.
- rank: 1 for the first or strongest recommendation, then 2, 3, and so on, in the order the answer presents them.
- website: the domain of one of the listed sources, but only when that source is clearly the business's own website (its title or domain names the business). Otherwise null. Never use a domain that is not in the source list.
- sourceNumbers: the numbers of the listed sources that mention or support that business. Use the answer's own [n] markers when present, otherwise judge by each source's title, url, and snippet. Use an empty array when none apply.
- Never invent businesses or source numbers.`;

export async function extractBrands(question: string, answer: ProviderAnswer): Promise<Extraction> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const sourceList = answer.sources
    .map((s, i) => `${i + 1}. ${s.title ?? "(no title)"} | ${s.url}${s.snippet ? ` | ${s.snippet}` : ""}`)
    .join("\n");

  const message = await client.messages.parse({
    model: MODEL,
    max_tokens: 3000,
    system: SYSTEM,
    output_config: { effort: "low", format: zodOutputFormat(extractionSchema) },
    messages: [
      {
        role: "user",
        content: `Question: ${question}\n\nAnswer:\n${answer.text.slice(0, 8000)}\n\nSources:\n${sourceList || "(none)"}`,
      },
    ],
  });

  if (!message.parsed_output) throw new Error("Could not read the structure of the answer.");
  return message.parsed_output;
}
