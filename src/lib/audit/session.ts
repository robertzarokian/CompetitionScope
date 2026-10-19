import { randomUUID } from "crypto";
import { ensureTables, pool } from "../tables";
import type { AuditInput } from "./schema";
import type { Plan } from "../plans";

// An audit session is created once per audit, after the server has checked the
// customer's plan. Every later request names the session instead of sending its
// own questions or website, so a visitor cannot ask for more than their plan
// allows or point the paid APIs at something else.
export const RUNS_PER_QUESTION = 2;

// Questions allowed in a one-off audit.
export function auditQuestionLimit(plan: Plan): number {
  return plan.id === "growth" || plan.id === "agency" ? 10 : 3;
}

export async function createAuditSession(userId: string, input: AuditInput, providerCount: number): Promise<string> {
  await ensureTables();
  const id = randomUUID();
  const cap = providerCount * input.questions.length * RUNS_PER_QUESTION;
  await pool().query(
    "INSERT INTO audit_sessions (id, user_id, input, calls_cap) VALUES ($1, $2, $3::jsonb, $4)",
    [id, userId, JSON.stringify(input), cap]
  );
  return id;
}

export async function getAuditSession(id: string, userId: string): Promise<AuditInput | null> {
  await ensureTables();
  const res = await pool().query<{ input: AuditInput }>(
    "SELECT input FROM audit_sessions WHERE id = $1 AND user_id = $2 AND created_at > now() - interval '6 hours'",
    [id, userId]
  );
  return res.rows[0]?.input ?? null;
}

// Counts one AI call against the session, and refuses once the allowance is used.
export async function consumeAuditCall(id: string, userId: string): Promise<boolean> {
  const res = await pool().query(
    `UPDATE audit_sessions SET calls_used = calls_used + 1
     WHERE id = $1 AND user_id = $2 AND calls_used < calls_cap AND created_at > now() - interval '6 hours'`,
    [id, userId]
  );
  return res.rowCount === 1;
}
