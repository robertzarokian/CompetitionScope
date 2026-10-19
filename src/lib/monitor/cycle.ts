import { processRuns, startDueRuns } from "./engine";
import { hasClaimableRuns } from "./store";

// One unit of background work: optionally start every check that is due, then
// work through unfinished checks for most of the function's time limit. If
// work is left over, ask the site to run another cycle (a fresh function with
// a fresh time limit). The chain is capped so a bug can never loop forever.
export async function runCycle(opts: { origin: string; depth: number; startDue: boolean }): Promise<void> {
  try {
    if (opts.startDue) await startDueRuns();
    await processRuns(240_000);
    const secret = process.env.CRON_SECRET;
    if (secret && opts.depth < 40 && (await hasClaimableRuns())) {
      // The target answers immediately and does its work in the background, so
      // waiting here is short.
      await fetch(`${opts.origin}/api/cron/monitor?depth=${opts.depth + 1}`, {
        headers: { authorization: `Bearer ${secret}` },
        signal: AbortSignal.timeout(20_000),
      }).catch(() => undefined);
    }
  } catch (err) {
    console.error("[monitor] cycle failed:", err);
  }
}
