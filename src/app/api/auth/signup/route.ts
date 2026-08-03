import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { updateDb } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await updateDb((db) => {
    if (db.users.some((u) => u.email === email)) {
      return { error: "An account with that email already exists." as const };
    }
    const user = {
      id: randomUUID(),
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return { user };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  await setSessionCookie(result.user.id);

  return NextResponse.json({
    user: { id: result.user.id, email: result.user.email },
  });
}
