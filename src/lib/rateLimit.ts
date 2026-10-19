import { getPool } from "./db";

// Database-backed usage counters. The audit tools call paid APIs on behalf of
// anonymous visitors, so every request is counted per visitor (IP) and in
// total per day. On serverless, in-memory counters would reset on every cold
// start and not be shared between instances, so the counts live in Postgres.

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS usage_counters (
           key TEXT PRIMARY KEY,
           count INTEGER NOT NULL DEFAULT 0,
           window_start TIMESTAMPTZ NOT NULL DEFAULT now()
         )`
      )
      .then(() => undefined);
    // If creation fails (for example a brief connection error) allow a retry.
    tableReady.catch(() => {
      tableReady = null;
    });
  }
  return tableReady;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown").slice(0, 64);
}

// Counts one use against "name" for the current window and reports whether it
// is still within the limit.
export async function consume(name: string, id: string, limit: number, windowSeconds: number): Promise<boolean> {
  await ensureTable();
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `${name}:${id}:${bucket}`;
  const pool = getPool();
  const res = await pool.query<{ count: number }>(
    `INSERT INTO usage_counters (key, count) VALUES ($1, 1)
     ON CONFLICT (key) DO UPDATE SET count = usage_counters.count + 1
     RETURNING count`,
    [key]
  );
  // Housekeeping: now and then, drop counters older than two days.
  if (Math.random() < 0.02) {
    pool.query(`DELETE FROM usage_counters WHERE window_start < now() - interval '2 days'`).catch(() => undefined);
  }
  return res.rows[0].count <= limit;
}

export class RateLimitError extends Error {}

// Applies a per-visitor limit and an optional site-wide daily limit.
export async function enforceLimits(
  request: Request,
  name: string,
  perIpPerHour: number,
  globalPerDay?: number
): Promise<void> {
  const ip = clientIp(request);
  if (!(await consume(name, ip, perIpPerHour, 3600))) {
    throw new RateLimitError("You have reached the hourly limit for this tool. Please try again later.");
  }
  if (globalPerDay && !(await consume(`${name}-all`, "all", globalPerDay, 86400))) {
    throw new RateLimitError("This tool has reached its daily capacity. Please try again tomorrow.");
  }
}
