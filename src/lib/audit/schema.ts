import { z } from "zod";
import { COUNTRY_CODES } from "./countries";

export const SCOPES = ["local", "national", "worldwide"] as const;
export type Scope = (typeof SCOPES)[number];

const text = (max: number) => z.string().trim().max(max);

// What the owner of the audited company tells us. Shared by the form (client)
// and every audit API route (server), so both sides enforce the same limits.
export const auditInputSchema = z
  .object({
    companyName: text(120).min(1, "Enter your company name."),
    website: text(300).min(3, "Enter your website."),
    services: text(400).min(2, "List your main services."),
    competitors: z.array(text(100).min(1)).max(5),
    scope: z.enum(SCOPES),
    city: text(80),
    region: text(80),
    countryCode: z.string().trim().max(2),
    questions: z.array(text(200).min(5, "Questions need at least 5 characters.")).min(1, "Add at least one question.").max(3),
  })
  .superRefine((v, ctx) => {
    if (v.scope !== "worldwide" && !COUNTRY_CODES.has(v.countryCode)) {
      ctx.addIssue({ code: "custom", path: ["countryCode"], message: "Choose a country." });
    }
    if (v.scope === "local" && !v.city) {
      ctx.addIssue({ code: "custom", path: ["city"], message: "Enter the city you serve." });
    }
  });

export type AuditInput = z.infer<typeof auditInputSchema>;

// Request bodies for the individual audit API routes.
export const siteRequestSchema = z.object({
  website: text(300).min(3),
  services: text(400),
  questions: z.array(text(200)).max(3),
  scope: z.enum(SCOPES),
  city: text(80),
});

export const visibilityRequestSchema = z.object({
  provider: z.string().trim().max(20),
  question: text(200).min(5),
  run: z.number().int().min(1).max(5),
  companyName: text(120).min(1),
  competitors: z.array(text(100)).max(5),
  scope: z.enum(SCOPES),
  city: text(80),
  region: text(80),
  countryCode: z.string().trim().max(2),
});

export const backlinksRequestSchema = z.object({
  domains: z.array(text(120).min(3)).min(1).max(8),
});

export const speedRequestSchema = z.object({ website: text(300).min(3) });

export type CheckStatus = "good" | "warn" | "bad" | "info";

// One row of the website checklist. "n" is the item number from the original
// requirements list so the owner can map results back to it.
export interface CheckRow {
  n: number;
  title: string;
  status: CheckStatus;
  summary: string;
  details: string[];
}

export interface PageInfo {
  url: string;
  status: number;
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  wordCount: number;
  titleHasKeyword: boolean;
  h1HasKeyword: boolean;
  hasFaqSection: boolean;
  hasFaqSchema: boolean;
}

export interface SiteAuditResult {
  finalUrl: string;
  checks: CheckRow[];
  pages: PageInfo[];
  note: string | null;
}

export interface SpeedResult {
  available: boolean;
  reason: string | null;
  performance: number | null;
  lcpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
  fcpMs: number | null;
  speedIndexMs: number | null;
  viewportOk: boolean | null;
}

export interface AnswerSource {
  url: string;
  title: string | null;
  domain: string;
  cited: boolean;
}

export interface RecommendedBrand {
  name: string;
  position: number;
  domain: string | null;
  sourceNumbers: number[];
  isClient: boolean;
  competitorName: string | null;
}

export interface VisibilityRun {
  provider: string;
  providerLabel: string;
  question: string;
  run: number;
  ok: boolean;
  error: string | null;
  text: string;
  sources: AnswerSource[];
  brands: RecommendedBrand[];
}

export interface BacklinkRow {
  domain: string;
  ok: boolean;
  error: string | null;
  rank: number | null;
  backlinks: number | null;
  referringDomains: number | null;
  referringMainDomains: number | null;
  spamScore: number | null;
}
