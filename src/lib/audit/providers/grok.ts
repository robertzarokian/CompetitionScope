import {
  asArray,
  postJson,
  ProviderError,
  sourceNumber,
  type AskContext,
  type Provider,
  type ProviderAnswer,
  type SourceDraft,
} from "./types";

// xAI's Responses API with the server-side web_search tool. It has no
// location option, so local questions rely on the place name in the question.
const MODEL = () => process.env.XAI_MODEL || "grok-4.7";

export const grokProvider: Provider = {
  id: "grok",
  label: "Grok",
  enabled: () => !!process.env.XAI_API_KEY,

  async ask(ctx: AskContext): Promise<ProviderAnswer> {
    const json = await postJson(
      "https://api.x.ai/v1/responses",
      { authorization: `Bearer ${process.env.XAI_API_KEY}` },
      {
        model: MODEL(),
        input: ctx.question,
        tools: [{ type: "web_search" }],
      },
      85_000,
      "Grok"
    );

    const sources: SourceDraft[] = [];
    let rawText = "";
    for (const item of asArray(json.output)) {
      if (item.type !== "message") continue;
      for (const part of asArray(item.content)) {
        if (part.type !== "output_text" || typeof part.text !== "string") continue;
        rawText += part.text;
        for (const a of asArray(part.annotations)) {
          if (a.type === "url_citation" && typeof a.url === "string") sourceNumber(sources, a.url, null, true);
        }
      }
    }
    if (!rawText.trim()) throw new ProviderError("Grok returned no answer.");

    // Grok writes inline citations as [[1]](https://...). Turn them into [n]
    // markers that point at our numbering.
    const text = rawText
      .replace(/\[\[\d+\]\]\((https?:[^)\s]+)\)/g, (_m, url: string) => ` [${sourceNumber(sources, url, null, true)}]`)
      .replace(/ {2,}/g, " ");

    // Sources the agent looked at but did not cite, if the response lists them.
    const extra = Array.isArray(json.citations) ? json.citations : [];
    for (const c of extra) {
      const url = typeof c === "string" ? c : typeof (c as Record<string, unknown>)?.url === "string" ? ((c as Record<string, unknown>).url as string) : null;
      if (url && !sources.some((s) => s.url === url)) sources.push({ url, title: null, snippet: null, cited: false });
    }
    return { text, sources };
  },
};
