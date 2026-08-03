import { promises as fs } from "fs";
import path from "path";
import type { Database } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const EMPTY_DB: Database = { users: [], reports: [], purchases: [] };

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDb(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf-8");
  }
}

export async function readDb(): Promise<Database> {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  try {
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      users: parsed.users ?? [],
      reports: parsed.reports ?? [],
      purchases: parsed.purchases ?? [],
    };
  } catch {
    return { ...EMPTY_DB };
  }
}

async function writeDb(db: Database): Promise<void> {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

/**
 * Serializes read-modify-write cycles so concurrent requests (dev hot reload,
 * two tabs) don't clobber each other's writes to the flat JSON file.
 */
export async function updateDb<T>(
  mutator: (db: Database) => T | Promise<T>
): Promise<T> {
  let result!: T;
  writeQueue = writeQueue.then(async () => {
    const db = await readDb();
    result = await mutator(db);
    await writeDb(db);
  });
  await writeQueue;
  return result;
}
