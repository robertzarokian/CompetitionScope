import { after, NextResponse } from "next/server";
import { z } from "zod";
import { getUserIdFromSession } from "@/lib/auth";
import { getPlan } from "@/lib/account";
import { runCycle } from "@/lib/monitor/cycle";
import { startRunForWatch } from "@/lib/monitor/engine";
import { deleteWatch, getWatch, listRuns, runningRunFor, saveTodo, setWatchActive } from "@/lib/monitor/store";

export const maxDuration = 300;

const RUN_NOW_COOLDOWN_MS = 12 * 3600_000;

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("pause") }),
  z.object({ action: z.literal("resume") }),
  z.object({ action: z.literal("run") }),
  z.object({ action: z.literal("todo"), todoId: z.string().max(40), done: z.boolean() }),
]);

// Progress of a watch's current check, polled by the dashboard.
export async function GET(_request: Request, ctx: RouteContext<"/api/watches/[id]">) {
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { id } = await ctx.params;
  const watch = await getWatch(id, userId);
  if (!watch) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const running = await runningRunFor(id);
  return NextResponse.json({
    running: !!running,
    done: running ? running.totalTasks - running.pending.length : 0,
    total: running ? running.totalTasks : 0,
  });
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/watches/[id]">) {
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { id } = await ctx.params;
  const watch = await getWatch(id, userId);
  if (!watch) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = parsed.data;

  if (body.action === "todo") {
    const todo = watch.todo.map((t) =>
      t.id === body.todoId ? { ...t, done: body.done, doneAt: body.done ? new Date().toISOString() : null, auto: false } : t
    );
    await saveTodo(id, todo);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "pause") {
    await setWatchActive(id, false);
    return NextResponse.json({ ok: true });
  }

  const plan = await getPlan(userId);
  if (!plan.limits.checkEveryDays) {
    return NextResponse.json({ error: "Tracking needs a paid plan." }, { status: 403 });
  }
  if (body.action === "resume") {
    await setWatchActive(id, true);
    return NextResponse.json({ ok: true });
  }

  // "run": check right now, at most twice a day because every check costs real money.
  if (await runningRunFor(id)) return NextResponse.json({ error: "A check is already running." }, { status: 409 });
  const last = (await listRuns(id, userId, 1))[0];
  if (last && Date.now() - last.startedAt.getTime() < RUN_NOW_COOLDOWN_MS) {
    return NextResponse.json({ error: "This company was checked recently. You can run another check in a few hours." }, { status: 429 });
  }
  await setWatchActive(id, true);
  await startRunForWatch(watch);
  const origin = new URL(request.url).origin;
  after(() => runCycle({ origin, depth: 0, startDue: false }));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/watches/[id]">) {
  const userId = await getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { id } = await ctx.params;
  await deleteWatch(id, userId);
  return NextResponse.json({ ok: true });
}
