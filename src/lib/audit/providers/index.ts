import { claudeProvider } from "./claude";
import { openaiProvider } from "./openai";
import { perplexityProvider } from "./perplexity";
import { geminiProvider } from "./gemini";
import { grokProvider } from "./grok";
import type { Provider, ProviderId } from "./types";

// Microsoft Copilot is not listed: it has no public API for the consumer
// product, so it cannot be checked.
export const PROVIDERS: Provider[] = [claudeProvider, openaiProvider, perplexityProvider, geminiProvider, grokProvider];

export function getProvider(id: string): Provider | undefined {
  return PROVIDERS.find((p) => p.id === (id as ProviderId));
}

export function enabledProviders(): Provider[] {
  return PROVIDERS.filter((p) => p.enabled());
}
