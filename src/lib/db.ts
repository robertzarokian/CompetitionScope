import { randomUUID } from "crypto";
import { Pool, type PoolClient } from "pg";
import type { CompetitionScopeReport, Database, PurchaseRecord, User } from "./types";

// Serializes every updateDb() transaction against each other via a Postgres
// advisory lock (arbitrary constant). This replaces the old JSON-file
// version's in-process write queue, which only ever protected a single
// Node process — on serverless, multiple instances run concurrently, so the
// lock needs to live in the database itself, not in process memory.
const WRITE_LOCK_KEY = 727_001;

declare global {
  var __pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global.__pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set.");
    }
    const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
    global.__pgPool = new Pool({
      connectionString,
      max: 3,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
    });
  }
  return global.__pgPool;
}

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(
        `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS reports (
          id TEXT PRIMARY KEY,
          owner_user_id TEXT,
          created_at TIMESTAMPTZ NOT NULL,
          status TEXT NOT NULL,
          unlocked BOOLEAN NOT NULL,
          source TEXT NOT NULL,
          data JSONB NOT NULL
        );
        CREATE TABLE IF NOT EXISTS purchases (
          id TEXT PRIMARY KEY,
          report_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          amount_cents INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          mode TEXT NOT NULL
        );
        `
      )
      .then(() => undefined);
  }
  return schemaReady;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

type ReportData = Omit<
  CompetitionScopeReport,
  "id" | "ownerUserId" | "createdAt" | "status" | "unlocked" | "source"
>;

interface ReportRow {
  id: string;
  owner_user_id: string | null;
  created_at: Date;
  status: string;
  unlocked: boolean;
  source: string;
  data: ReportData;
}

interface PurchaseRow {
  id: string;
  report_id: string;
  user_id: string;
  amount_cents: number;
  created_at: Date;
  mode: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at.toISOString(),
  };
}

function rowToReport(row: ReportRow): CompetitionScopeReport {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at.toISOString(),
    status: row.status as CompetitionScopeReport["status"],
    unlocked: row.unlocked,
    source: row.source as CompetitionScopeReport["source"],
    ...row.data,
  };
}

function rowToPurchase(row: PurchaseRow): PurchaseRecord {
  return {
    reportId: row.report_id,
    userId: row.user_id,
    amountCents: row.amount_cents,
    createdAt: row.created_at.toISOString(),
    mode: row.mode as PurchaseRecord["mode"],
  };
}

async function fetchAll(queryable: Pool | PoolClient): Promise<Database> {
  // Sequential, not Promise.all: this runs against a single PoolClient inside
  // updateDb()'s transaction, and a connection can only run one query at a
  // time — concurrent calls there would only "work" via pg's deprecated
  // internal queueing, not real parallelism.
  const usersRes = await queryable.query<UserRow>("SELECT * FROM users");
  const reportsRes = await queryable.query<ReportRow>("SELECT * FROM reports");
  const purchasesRes = await queryable.query<PurchaseRow>(
    "SELECT * FROM purchases ORDER BY created_at ASC"
  );
  return {
    users: usersRes.rows.map(rowToUser),
    reports: reportsRes.rows.map(rowToReport),
    purchases: purchasesRes.rows.map(rowToPurchase),
  };
}

async function writeUser(client: PoolClient, user: User): Promise<void> {
  await client.query(
    `INSERT INTO users (id, email, password_hash, created_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash`,
    [user.id, user.email, user.passwordHash, user.createdAt]
  );
}

async function writeReport(client: PoolClient, report: CompetitionScopeReport): Promise<void> {
  const { id, ownerUserId, createdAt, status, unlocked, source, ...data } = report;
  await client.query(
    `INSERT INTO reports (id, owner_user_id, created_at, status, unlocked, source, data)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       owner_user_id = EXCLUDED.owner_user_id,
       status = EXCLUDED.status,
       unlocked = EXCLUDED.unlocked,
       source = EXCLUDED.source,
       data = EXCLUDED.data`,
    [id, ownerUserId, createdAt, status, unlocked, source, JSON.stringify(data)]
  );
}

async function writePurchase(client: PoolClient, purchase: PurchaseRecord): Promise<void> {
  await client.query(
    `INSERT INTO purchases (id, report_id, user_id, amount_cents, created_at, mode)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      randomUUID(),
      purchase.reportId,
      purchase.userId,
      purchase.amountCents,
      purchase.createdAt,
      purchase.mode,
    ]
  );
}

export async function readDb(): Promise<Database> {
  await ensureSchema();
  return fetchAll(getPool());
}

/**
 * Preserves the file-based version's readDb/updateDb shape (load
 * everything, mutate the in-memory object, persist) so every call site
 * written against the JSON file works unchanged against Postgres.
 */
export async function updateDb<T>(
  mutator: (db: Database) => T | Promise<T>
): Promise<T> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [WRITE_LOCK_KEY]);

    const db = await fetchAll(client);
    const purchaseCountBefore = db.purchases.length;

    const result = await mutator(db);

    for (const user of db.users) await writeUser(client, user);
    for (const report of db.reports) await writeReport(client, report);
    for (const purchase of db.purchases.slice(purchaseCountBefore)) {
      await writePurchase(client, purchase);
    }

    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
