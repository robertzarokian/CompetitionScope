import { createHash, randomBytes, randomUUID } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { ensureTables, pool } from "./tables";

// Admin accounts are separate from customer accounts. Sessions are random
// tokens stored (hashed) in the database, so they stay safe even if the site's
// signing secret is weak or leaks, and they can be revoked instantly.
const COOKIE = "cs_admin";
const SESSION_HOURS = 8;
const USERNAME = /^[A-Za-z0-9_.-]{3,32}$/;

export interface Admin {
  id: string;
  username: string;
  createdAt: Date;
  disabled: boolean;
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export function validateNewAdmin(username: string, password: string): string | null {
  if (!USERNAME.test(username)) return "Usernames use 3 to 32 letters, numbers, dots, dashes, or underscores.";
  if (password.length < 12) return "Passwords need at least 12 characters.";
  if (password.length > 200) return "That password is too long.";
  return null;
}

export async function createAdmin(username: string, password: string, createdBy: string | null): Promise<Admin> {
  await ensureTables();
  const hash = await bcrypt.hash(password, 12);
  const res = await pool().query(
    `INSERT INTO admins (id, username, username_lower, password_hash, created_by)
     VALUES ($1,$2,$3,$4,$5) RETURNING id, username, created_at, disabled`,
    [randomUUID(), username, username.toLowerCase(), hash, createdBy]
  );
  const r = res.rows[0];
  return { id: r.id, username: r.username, createdAt: r.created_at, disabled: r.disabled };
}

// A real hash to compare against when the username does not exist, so a wrong
// username takes as long as a wrong password and reveals nothing.
let dummyHash: string | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("not-a-real-password", 12));

export async function verifyAdminLogin(username: string, password: string): Promise<Admin | null> {
  await ensureTables();
  const res = await pool().query(
    "SELECT id, username, password_hash, created_at, disabled FROM admins WHERE username_lower = $1",
    [username.toLowerCase()]
  );
  const row = res.rows[0];
  const ok = await bcrypt.compare(password, row?.password_hash ?? getDummyHash());
  if (!row || !ok || row.disabled) return null;
  return { id: row.id, username: row.username, createdAt: row.created_at, disabled: false };
}

export async function startAdminSession(adminId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  await pool().query(
    `INSERT INTO admin_sessions (token_hash, admin_id, expires_at) VALUES ($1,$2, now() + make_interval(hours => $3))`,
    [sha(token), adminId, SESSION_HOURS]
  );
  await pool().query("DELETE FROM admin_sessions WHERE expires_at < now()");
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await pool().query("DELETE FROM admin_sessions WHERE token_hash = $1", [sha(token)]);
  store.delete(COOKIE);
}

export async function getAdmin(): Promise<Admin | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  await ensureTables();
  const res = await pool().query(
    `SELECT a.id, a.username, a.created_at, a.disabled FROM admin_sessions s
     JOIN admins a ON a.id = s.admin_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND NOT a.disabled`,
    [sha(token)]
  );
  const r = res.rows[0];
  return r ? { id: r.id, username: r.username, createdAt: r.created_at, disabled: r.disabled } : null;
}

// For admin pages: send anyone who is not a signed-in admin to the login page.
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function logAdmin(admin: Pick<Admin, "id" | "username">, action: string, detail = ""): Promise<void> {
  await pool().query("INSERT INTO admin_log (id, admin_id, admin_username, action, detail) VALUES ($1,$2,$3,$4,$5)", [
    randomUUID(),
    admin.id,
    admin.username,
    action,
    detail.slice(0, 500),
  ]);
}

export async function setAdminPassword(adminId: string, password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 12);
  await pool().query("UPDATE admins SET password_hash = $2 WHERE id = $1", [adminId, hash]);
  // Changing a password signs that admin out everywhere.
  await pool().query("DELETE FROM admin_sessions WHERE admin_id = $1", [adminId]);
}

// Mutating admin requests must come from this site, as a second guard on top
// of the SameSite=Strict cookie.
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
