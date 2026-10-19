import type { AuditInput, BacklinkRow, SiteAuditResult, SpeedResult, VisibilityRun } from "../audit/schema";

export type Task =
  | { type: "visibility"; provider: string; question: string; run: number }
  | { type: "site" }
  | { type: "speed" }
  | { type: "refresh" };

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  doneAt: string | null;
  // Ticked automatically because a later check showed the problem fixed.
  auto: boolean;
}

export interface Watch {
  id: string;
  userId: string;
  name: string;
  input: AuditInput;
  reportId: string | null;
  nextRunAt: Date;
  active: boolean;
  todo: TodoItem[];
  createdAt: Date;
}

export interface RunSummary {
  answers: number;
  failed: number;
  clientMentions: number;
  // Share of AI answers that named the company, 0 to 1. Null when no answers were read.
  mentionRate: number | null;
  avgPosition: number | null;
  topBrands: { name: string; mentions: number }[];
  checks: { n: number; title: string; status: string }[] | null;
  speedScore: number | null;
  backlinks: { domain: string; rank: number | null; referringDomains: number | null }[] | null;
  refreshCompetitors: string[] | null;
}

export interface WatchRun {
  id: string;
  watchId: string;
  userId: string;
  startedAt: Date;
  finishedAt: Date | null;
  status: "running" | "done" | "failed";
  pending: Task[];
  runs: VisibilityRun[];
  site: SiteAuditResult | null;
  speed: SpeedResult | null;
  backlinks: BacklinkRow[] | null;
  refresh: { reportId: string; competitors: string[] } | null;
  summary: RunSummary | null;
  totalTasks: number;
}

export interface AlertRow {
  id: string;
  userId: string;
  watchId: string | null;
  createdAt: Date;
  kind: string;
  title: string;
  body: string;
  read: boolean;
}
