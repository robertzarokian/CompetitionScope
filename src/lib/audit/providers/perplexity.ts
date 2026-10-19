import {
  asArray,
  locationFor,
  postJson,
  ProviderError,
  type AskContext,
  type Provider,
  type ProviderAnswer,
  type SourceDraft,
} from "./types";

// Perplexity retired its Sonar chat completions endpoint on 2026-09-27 in
// favour of the Agent API. The "fast" preset runs a web search by default.
const PRESET = () => process.env.PERPLEXITY_PRESET || "fast";

export const perplexityProvider: Provider = {
  id: "perplexity",
  label: "Perplexity",
  enabled: () => !!process.env.PERPLEXITY_API_KEY,

  async ask(ctx: AskContext): Promise<ProviderAnswer> {
    const loc = locationFor(ctx);
    const json = await postJson(
      "https://api.perplexity.ai/v1/agent",
      { authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}` },
      {
        preset: PRESET(),
        input: ctx.question,
        tools: [{ type: "web_search", ...(loc ? { user_location: loc } : {}) }],
      },
      85_000,
      "Perplexity"
    );

    // Perplexity numbers its search results by id and uses [id] (or [web:id])
    // markers in the text. Renumber to our own 1..n order.
    const results = new Map<number, { url: string; title: string | null; snippet: string | null }>();
    let rawText = "";
    for (const item of asArray(json.output)) {
      if (item.type === "search_results") {
        for (const r of asArray(item.results)) {
          if (typeof r.url === "string") {
            results.set(Number(r.id), {
              url: r.url,
              title: typeof r.title === "string" ? r.title : null,
              snippet: typeof r.snippet === "string" ? r.snippet.slice(0, 240) : null,
            });
          }
        }
      }
      if (item.type === "message") {
        for (const part of asArray(item.content)) {
          if (part.type === "output_text" && typeof part.text === "string") rawText += part.text;
        }
      }
    }
    if (!rawText.trim()) throw new ProviderError("Perplexity returned no answer.");

    const sources: SourceDraft[] = [];
    const seq = new Map<number, number>();
    const text = rawText.replace(/\[(?:web:)?(\d+)\]/g, (_m, id: string) => {
      const r = results.get(Number(id));
      if (!r) return "";
      if (!seq.has(Number(id))) {
        sources.push({ ...r, cited: true });
        seq.set(Number(id), sources.length);
      }
      return `[${seq.get(Number(id))}]`;
    });
    for (const [id, r] of results) {
      if (!seq.has(id)) sources.push({ ...r, cited: false });
    }
    return { text, sources };
  },
};
