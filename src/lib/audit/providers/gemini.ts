import {
  asArray,
  insertMarkersByByte,
  postJson,
  ProviderError,
  sourceNumber,
  type AskContext,
  type Provider,
  type ProviderAnswer,
  type SourceDraft,
} from "./types";

// Google's current Search grounding docs use the Interactions API and
// gemini-3.8-flash. Override with GEMINI_MODEL if the model line changes.
// The Search tool has no location option, so local questions rely on the
// place name being in the question itself.
const MODEL = () => process.env.GEMINI_MODEL || "gemini-3.8-flash";

export const geminiProvider: Provider = {
  id: "gemini",
  label: "Gemini",
  enabled: () => !!process.env.GEMINI_API_KEY,

  async ask(ctx: AskContext): Promise<ProviderAnswer> {
    const json = await postJson(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      { "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
      {
        model: MODEL(),
        input: ctx.question,
        tools: [{ type: "google_search" }],
      },
      85_000,
      "Gemini"
    );

    const steps = asArray(json.steps);
    if (steps.length === 0) {
      console.error(`[audit] Gemini unexpected response keys: ${Object.keys(json).join(", ")}`);
      throw new ProviderError("Gemini returned an unexpected response.");
    }

    const sources: SourceDraft[] = [];
    let text = "";
    for (const step of steps) {
      if (step.type !== "model_output") continue;
      for (const part of asArray(step.content)) {
        if (part.type !== "text" || typeof part.text !== "string") continue;
        const marks: { at: number; n: number }[] = [];
        const annotations = asArray(part.annotations)
          .filter((a) => a.type === "url_citation" && typeof a.url === "string")
          .sort((a, b) => Number(a.start_index) - Number(b.start_index));
        for (const a of annotations) {
          const n = sourceNumber(sources, a.url as string, typeof a.title === "string" ? a.title : null, true);
          marks.push({ at: Number(a.end_index), n });
        }
        text += insertMarkersByByte(part.text, marks);
      }
    }
    if (!text.trim()) throw new ProviderError("Gemini returned no answer.");
    return { text, sources };
  },
};
