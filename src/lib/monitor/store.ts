import { randomUUID } from "crypto";
import { ensureTables, pool } from "../tables";
import type { AuditInput } from "../audit/schema";
import type { AlertRow, RunSummary, Task, TodoItem, Watch, WatchRun } from "./types";

interface WatchDb {
  id: string;
  user_id: string;
  name: string;
  input: AuditInput;
  report_id: string | null;
  next_run_at: Date;
  active: boolean;
  todo: TodoItem[];
  created_at: Date;
}

const toWatch = (r: WatchDb): Watch => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  input: r.input,
  reportId: r.report_id,
  nextRunAt: r.next_run_at,
  active: r.active,
  todo: r.todo ?? [],
  createdAt: r.created_at,
});

export async function createWatch(userId: string, input: AuditInput, reportId: string | null): Promise<Watch> {
  await ensureTables();
  const res = await pool().query<WatchDb>(
    `INSERT INTO watches (id, user_id, name, input, report_id, next_run_at)
     VALUES ($1, $2, $3, $4::jsonb, $5, now()) RETURNING *`,
    [randomUUID(), userId, input.companyName, JSON.stringify(input), reportId]
  );
  return toWatch(res.rows[0]);
}

export async function listWatches(userId: string): Promise<Watch[]> {
  await ensureTables();
  const res = await pool().query<WatchDb>("SELECT * FROM watches WHERE user_id = $1 ORDER BY created_at", [userId]);
  return res.rows.map(toWatch);
}

export async function getWatch(id: string, userId: string): Promise<Watch | null> {
  await ensureTables();
  const res = await pool().query<WatchDb>("SELECT * FROM watches WHERE id = $1 AND user_id = $2", [id, userId]);
  return res.rows[0] ? toWatch(res.rows[0]) : null;
}

export async function getWatchById(id: string): Promise<Watch | null> {
  await ensureTables();
  const res = await pool().query<WatchDb>("SELECT * FROM watches WHERE id = $1", [id]);
  return res.rows[0] ? toWatch(res.rows[0]) : null;
}

export async function setWatchActive(id: string, active: boolean) {
  await pool().query("UPDATE watches SET active = $2 WHERE id = $1", [id, active]);
}

export async function saveTodo(id: string, todo: TodoItem[]) {
  await pool().query("UPDATE watches SET todo = $2::jsonb WHERE id = $1", [id, JSON.stringify(todo)]);
}

export async function deleteWatch(id: string, userId: string) {
  await ensureTables();
  await pool().query("DELETE FROM watch_runs WHERE watch_id = $1 AND user_id = $2", [id, userId]);
  await pool().query("DELETE FROM alerts WHERE watch_id = $1 AND user_id = $2", [id, userId]);
  await pool().query("DELETE FROM watches WHERE id = $1 AND user_id = $2", [id, userId]);
}

// Atomically claims every watch that is due, moving its next date forward so
// two overlapping cron calls can never start the same check twice.
export async function claimDueWatches(frequencyDaysFor: (userId: string) => Promise<number>): Promise<Watch[]> {
  await ensureTables();
  const due = await pool().query<WatchDb>(
    "SELECT * FROM watches WHERE active AND next_run_at <= now() ORDER BY next_run_at LIMIT 50"
  );
  const claimed: Watch[] = [];
  for (const row of due.rows) {
    const days = await frequencyDaysFor(row.user_id);
    const res = await pool().query<WatchDb>(
      `UPDATE watches SET next_run_at = now() + make_interval(days => $2)
       WHERE id = $1 AND active AND next_run_at <= now() RETURNING *`,
      [row.id, Math.max(days, 1)]
    );
    if (res.rows[0]) claimed.push(toWatch(res.rows[0]));
  }
  return claimed;
}

export async function rescheduleWatch(id: string, days: number) {
  await pool().query("UPDATE watches SET next_run_at = now() + make_interval(days => $2) WHERE id = $1", [id, Math.max(days, 1)]);
}

interface RunDb {
  id: string;
  watch_id: string;
  user_id: string;
  started_at: Date;
  finished_at: Date | null;
  status: "running" | "done" | "failed";
  total_tasks: number;
  pending: Task[];
  runs: WatchRun["runs"];
  site: WatchRun["site"];
  speed: WatchRun["speed"];
  backlinks: WatchRun["backlinks"];
  refresh: WatchRun["refresh"];
  summary: RunSummary | null;
}

const toRun = (r: RunDb): WatchRun => ({
  id: r.id,
  watchId: r.watch_id,
  userId: r.user_id,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
  status: r.status,
  pending: r.pending ?? [],
  runs: r.runs ?? [],
  site: r.site,
  speed: r.speed,
  backlinks: r.backlinks,
  refresh: r.refresh,
  summary: r.summary,
  totalTasks: r.total_tasks,
});

export async function createRun(watch: Watch, tasks: Task[]): Promise<WatchRun> {
  await ensureTables();
  const res = await pool().query<RunDb>(
    `INSERT INTO watch_runs (id, watch_id, user_id, status, total_tasks, pending)
     VALUES ($1, $2, $3, 'running', $4, $5::jsonb) RETURNING *`,
    [randomUUID(), watch.id, watch.userId, tasks.length, JSON.stringify(tasks)]
  );
  return toRun(res.rows[0]);
}

// Takes the oldest unfinished run that nobody else is working on. The claim
// expires on its own, so a run is never stuck if a worker is cut off.
export async function claimNextRun(ownerUserId?: string): Promise<WatchRun | null> {
  await ensureTables();
  const res = await pool().query<RunDb>(
    `UPDATE watch_runs SET claimed_until = now() + interval '6 minutes'
     WHERE id = (
       SELECT id FROM watch_runs
       WHERE status = 'running' AND (claimed_until IS NULL OR claimed_until < now())
         AND ($1::text IS NULL OR user_id = $1)
       ORDER BY started_at LIMIT 1 FOR UPDATE SKIP LOCKED
     ) RETURNING *`,
    [ownerUserId ?? null]
  );
  return res.rows[0] ? toRun(res.rows[0]) : null;
}

export async function saveRunProgress(run: WatchRun) {
  await pool().query(
    `UPDATE watch_runs SET pending = $2::jsonb, runs = $3::jsonb, site = $4::jsonb, speed = $5::jsonb,
       refresh = $6::jsonb, claimed_until = now() + interval '6 minutes' WHERE id = $1`,
    [
      run.id,
      JSON.stringify(run.pending),
      JSON.stringify(run.runs),
      JSON.stringify(run.site),
      JSON.stringify(run.speed),
      JSON.stringify(run.refresh),
    ]
  );
}

export async function finishRun(run: WatchRun, status: "done" | "failed") {
  await pool().query(
    `UPDATE watch_runs SET status = $2, finished_at = now(), pending = '[]'::jsonb, runs = $3::jsonb,
       site = $4::jsonb, speed = $5::jsonb, backlinks = $6::jsonb, refresh = $7::jsonb, summary = $8::jsonb,
       claimed_until = NULL WHERE id = $1`,
    [
      run.id,
      status,
      JSON.stringify(run.runs),
      JSON.stringify(run.site),
      JSON.stringify(run.speed),
      JSON.stringify(run.backlinks),
      JSON.stringify(run.refresh),
      JSON.stringify(run.summary),
    ]
  );
}

export async function releaseRun(id: string) {
  await pool().query("UPDATE watch_runs SET claimed_until = NULL WHERE id = $1", [id]);
}

export async function listRuns(watchId: string, userId: string, limit = 30): Promise<WatchRun[]> {
  await ensureTables();
  const res = await pool().query<RunDb>(
    "SELECT * FROM watch_runs WHERE watch_id = $1 AND user_id = $2 ORDER BY started_at DESC LIMIT $3",
    [watchId, userId, limit]
  );
  return res.rows.map(toRun);
}

// True when an unfinished run exists that no worker is currently handling.
export async function hasClaimableRuns(): Promise<boolean> {
  await ensureTables();
  const res = await pool().query(
    "SELECT 1 FROM watch_runs WHERE status = 'running' AND (claimed_until IS NULL OR claimed_until < now()) LIMIT 1"
  );
  return res.rowCount !== null && res.rowCount > 0;
}

export async function runningRunFor(watchId: string): Promise<WatchRun | null> {
  await ensureTables();
  const res = await pool().query<RunDb>(
    "SELECT * FROM watch_runs WHERE watch_id = $1 AND status = 'running' ORDER BY started_at DESC LIMIT 1",
    [watchId]
  );
  return res.rows[0] ? toRun(res.rows[0]) : null;
}

// A run that has been "running" for over a day is abandoned (for example the
// plan was cancelled mid-run); mark it failed so it stops blocking new ones.
export async function failStaleRuns() {
  await ensureTables();
  await pool().query(
    "UPDATE watch_runs SET status = 'failed', finished_at = now(), claimed_until = NULL WHERE status = 'running' AND started_at < now() - interval '1 day'"
  );
}

interface AlertDb {
  id: string;
  user_id: string;
  watch_id: string | null;
  created_at: Date;
  kind: string;
  title: string;
  body: string;
  read: boolean;
}

export async function createAlert(a: { userId: string; watchId: string | null; kind: string; title: string; body: string }) {
  await ensureTables();
  await pool().query(
    "INSERT INTO alerts (id, user_id, watch_id, kind, title, body) VALUES ($1,$2,$3,$4,$5,$6)",
    [randomUUID(), a.userId, a.watchId, a.kind, a.title, a.body]
  );
}

export async function listAlerts(userId: string, limit = 30): Promise<AlertRow[]> {
  await ensureTables();
  const res = await pool().query<AlertDb>("SELECT * FROM alerts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2", [userId, limit]);
  return res.rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    watchId: r.watch_id,
    createdAt: r.created_at,
    kind: r.kind,
    title: r.title,
    body: r.body,
    read: r.read,
  }));
}

export async function markAlertsRead(userId: string) {
  await ensureTables();
  await pool().query("UPDATE alerts SET read = true WHERE user_id = $1 AND NOT read", [userId]);
}
