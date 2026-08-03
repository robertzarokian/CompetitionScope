import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { readDb } from "./db";
import type { User } from "./types";

const SESSION_COOKIE = "cs_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ??
    "dev-only-insecure-secret-change-me-in-production";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function setSessionCookie(userId: string): Promise<void> {
  const token = await createSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getUserIdFromSession(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<Omit<User, "passwordHash"> | null> {
  const userId = await getUserIdFromSession();
  if (!userId) return null;
  const db = await readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return null;
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}
