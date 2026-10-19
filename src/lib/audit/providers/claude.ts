import Anthropic from "@anthropic-ai/sdk";
import { locationFor, ProviderError, type AskContext, type Provider, type ProviderAnswer, type SourceDraft } from "./types";

const MODEL = process.env.AUDIT_CLAUDE_MODEL || "claude-opus-5";

export const claudeProvider: Provider = {
  id: "claude",
  label: "Claude",
  enabled: () => !!process.env.ANTHROPIC_API_KEY,

  async ask(ctx: AskContext): Promise<ProviderAnswer> {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const loc = locationFor(ctx);

    let messages: Anthropic.MessageParam[] = [{ role: "user", content: ctx.question }];
    const sources: SourceDraft[] = [];
    let text = "";

    for (let attempt = 0; attempt < 3; attempt++) {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: 4000,
        output_config: { effort: "low" },
        tools: [
          {
            // The basic search tool attaches a citation to each claim, which the
            // audit needs for tracing sources. The newer dynamic-filtering
            // version returns none, and was also slower and less consistent.
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 3,
            ...(loc ? { user_location: { type: "approximate" as const, ...loc } } : {}),
          },
        ],
        messages,
      });
      const message = await stream.finalMessage();

      if (message.stop_reason === "refusal") throw new ProviderError("Claude declined to answer this question.");

      // Cited sources get their numbers in order of first citation, and the
      // answer text gets matching [n] markers so each claim can be traced.
      let turnText = "";
      for (const block of message.content) {
        if (block.type === "text") {
          turnText += block.text;
          const numbers = new Set<number>();
          for (const c of block.citations ?? []) {
            if (c.type !== "web_search_result_location") continue;
            let idx = sources.findIndex((s) => s.url === c.url);
            if (idx < 0) {
              sources.push({ url: c.url, title: c.title ?? null, snippet: c.cited_text?.slice(0, 240) ?? null, cited: true });
              idx = sources.length - 1;
            }
            numbers.add(idx + 1);
          }
          if (numbers.size > 0) turnText += ` [${Array.from(numbers).join(", ")}]`;
        }
      }
      if (turnText.trim()) text = turnText;

      // Pages the search returned but the answer did not cite come last.
      for (const block of message.content) {
        if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
          for (const r of block.content) {
            if (r.type === "web_search_result" && !sources.some((s) => s.url === r.url)) {
              sources.push({ url: r.url, title: r.title ?? null, snippet: null, cited: false });
            }
          }
        }
      }

      if (message.stop_reason === "pause_turn") {
        messages = [...messages, { role: "assistant", content: message.content }];
        continue;
      }
      break;
    }

    if (!text.trim()) throw new ProviderError("Claude returned no answer.");
    return { text, sources };
  },
};
