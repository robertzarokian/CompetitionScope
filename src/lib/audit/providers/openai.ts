import {
  asArray,
  insertMarkers,
  locationFor,
  postJson,
  ProviderError,
  sourceNumber,
  type AskContext,
  type Provider,
  type ProviderAnswer,
  type SourceDraft,
} from "./types";

// The OpenAI docs currently use gpt-6-astra in their web search examples.
// Override with OPENAI_MODEL if the model line changes.
const MODEL = () => process.env.OPENAI_MODEL || "gpt-6-astra";

export const openaiProvider: Provider = {
  id: "chatgpt",
  label: "ChatGPT",
  enabled: () => !!process.env.OPENAI_API_KEY,

  async ask(ctx: AskContext): Promise<ProviderAnswer> {
    const loc = locationFor(ctx);
    const json = await postJson(
      "https://api.openai.com/v1/responses",
      { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      {
        model: MODEL(),
        input: ctx.question,
        tools: [{ type: "web_search", ...(loc ? { user_location: { type: "approximate", ...loc } } : {}) }],
        tool_choice: "auto",
        include: ["web_search_call.action.sources"],
      },
      85_000,
      "ChatGPT"
    );

    const sources: SourceDraft[] = [];
    let text = "";
    const consulted: string[] = [];

    for (const item of asArray(json.output)) {
      if (item.type === "web_search_call") {
        const action = (item.action ?? {}) as Record<string, unknown>;
        for (const s of asArray(action.sources)) if (typeof s.url === "string") consulted.push(s.url);
      }
      if (item.type !== "message") continue;
      for (const part of asArray(item.content)) {
        if (part.type !== "output_text" || typeof part.text !== "string") continue;
        const marks: { at: number; n: number }[] = [];
        const annotations = asArray(part.annotations)
          .filter((a) => a.type === "url_citation" && typeof a.url === "string")
          .sort((a, b) => Number(a.start_index) - Number(b.start_index));
        for (const a of annotations) {
          const n = sourceNumber(sources, a.url as string, typeof a.title === "string" ? a.title : null, true);
          marks.push({ at: Number(a.end_index) || part.text.length, n });
        }
        text += insertMarkers(part.text, marks);
      }
    }

    for (const url of consulted) {
      if (!sources.some((s) => s.url === url)) sources.push({ url, title: null, snippet: null, cited: false });
    }
    if (!text.trim()) throw new ProviderError("ChatGPT returned no answer.");
    return { text, sources };
  },
};
