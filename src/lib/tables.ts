import { getPool } from "./db";

// Tables for subscriptions, monitoring, and the audit tool. Created on first
// use, like the original tables in db.ts. JSONB columns are always written
// with JSON.stringify(...)::jsonb, because the pg driver would otherwise turn
// a JavaScript array into a Postgres array.
let ready: Promise<void> | null = null;

export function ensureTables(): Promise<void> {
  if (!ready) {
    ready = getPool()
      .query(
        `
        CREATE TABLE IF NOT EXISTS subscriptions (
          user_id TEXT PRIMARY KEY,
          plan TEXT NOT NULL,
          interval TEXT NOT NULL,
          status TEXT NOT NULL,
          stripe_customer_id TEXT,
          stripe_subscription_id TEXT,
          current_period_end TIMESTAMPTZ,
          cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS subscriptions_customer_idx ON subscriptions (stripe_customer_id);
        CREATE TABLE IF NOT EXISTS profiles (
          user_id TEXT PRIMARY KEY,
          brand_name TEXT,
          free_audits_used INTEGER NOT NULL DEFAULT 0,
          email_alerts BOOLEAN NOT NULL DEFAULT true,
          last_billing_sync TIMESTAMPTZ
        );
        CREATE TABLE IF NOT EXISTS audit_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          input JSONB NOT NULL,
          calls_cap INTEGER NOT NULL,
          calls_used INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS watches (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          input JSONB NOT NULL,
          report_id TEXT,
          next_run_at TIMESTAMPTZ NOT NULL,
          active BOOLEAN NOT NULL DEFAULT true,
          todo JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS watches_user_idx ON watches (user_id);
        CREATE TABLE IF NOT EXISTS watch_runs (
          id TEXT PRIMARY KEY,
          watch_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          finished_at TIMESTAMPTZ,
          status TEXT NOT NULL,
          total_tasks INTEGER NOT NULL DEFAULT 0,
          pending JSONB NOT NULL DEFAULT '[]'::jsonb,
          runs JSONB NOT NULL DEFAULT '[]'::jsonb,
          site JSONB,
          speed JSONB,
          backlinks JSONB,
          refresh JSONB,
          summary JSONB,
          claimed_until TIMESTAMPTZ
        );
        CREATE INDEX IF NOT EXISTS watch_runs_watch_idx ON watch_runs (watch_id, started_at DESC);
        CREATE TABLE IF NOT EXISTS alerts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          watch_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          kind TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          read BOOLEAN NOT NULL DEFAULT false,
          emailed BOOLEAN NOT NULL DEFAULT false
        );
        CREATE INDEX IF NOT EXISTS alerts_user_idx ON alerts (user_id, created_at DESC);
        CREATE TABLE IF NOT EXISTS admins (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL,
          username_lower TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          created_by TEXT,
          disabled BOOLEAN NOT NULL DEFAULT false
        );
        CREATE TABLE IF NOT EXISTS admin_sessions (
          token_hash TEXT PRIMARY KEY,
          admin_id TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          expires_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS admin_log (
          id TEXT PRIMARY KEY,
          admin_id TEXT,
          admin_username TEXT NOT NULL,
          action TEXT NOT NULL,
          detail TEXT NOT NULL DEFAULT '',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS admin_log_idx ON admin_log (created_at DESC);
        `
      )
      .then(() => undefined);
    // If creation fails (for example a brief connection error) allow a retry.
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}

export function pool() {
  return getPool();
}
