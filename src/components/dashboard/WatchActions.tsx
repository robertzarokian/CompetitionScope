"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pause, Play, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";

export function WatchActions({ id, active, runningInitially }: { id: string; active: boolean; runningInitially: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(runningInitially);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // While a check runs, poll its progress and refresh the page when it ends.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/watches/${id}`).catch(() => null);
      const data = res ? await res.json().catch(() => null) : null;
      if (!data) return;
      if (data.running) setProgress({ done: data.done, total: data.total });
      else {
        setRunning(false);
        router.refresh();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [running, id, router]);

  async function act(body: object) {
    setError(null);
    const res = await fetch(`/api/watches/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Something went wrong.");
    if ((body as { action: string }).action === "run") setRunning(true);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("Remove this company and all of its history?")) return;
    await fetch(`/api/watches/${id}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" onClick={() => void act({ action: "run" })} disabled={running}>
        {running ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        {running ? `Checking${progress ? ` (${progress.done} of ${progress.total})` : ""}` : "Check now"}
      </Button>
      <Button size="sm" variant="secondary" onClick={() => void act({ action: active ? "pause" : "resume" })}>
        {active ? <Pause size={14} /> : <Play size={14} />}
        {active ? "Pause" : "Resume"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => void remove()}>
        <Trash2 size={14} />
        Remove
      </Button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </div>
  );
}
