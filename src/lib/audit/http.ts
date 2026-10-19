import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { FetchBlockedError } from "./safeFetch";
import { ProviderError } from "./providers/types";
import { RateLimitError } from "../rateLimit";

export function fail(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// Reads and validates a small JSON body.
export async function readBody<T>(request: Request, schema: ZodType<T>): Promise<T | NextResponse> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 20_000) return fail("The request is too large.", 413);
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return fail("Invalid request.", 400);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  return parsed.data;
}

// Visitors only ever see the messages of errors we raise on purpose.
// Anything unexpected is logged and replaced with a generic message.
export function handleError(err: unknown) {
  if (err instanceof RateLimitError) return fail(err.message, 429);
  if (err instanceof FetchBlockedError) return fail(err.message, 400);
  if (err instanceof ProviderError) return fail(err.message, 502);
  console.error("[audit] unexpected error:", err);
  const code = (err as NodeJS.ErrnoException)?.code;
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return fail("That website could not be found.", 400);
  if (code === "ECONNREFUSED" || code === "ECONNRESET" || code === "ETIMEDOUT") return fail("The website could not be reached.", 400);
  return fail("Something went wrong running this check. Please try again.", 500);
}
