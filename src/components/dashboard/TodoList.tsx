"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TodoItem } from "@/lib/monitor/types";

export function TodoList({ watchId, items }: { watchId: string; items: TodoItem[] }) {
  const router = useRouter();
  const [state, setState] = useState(items);

  async function toggle(id: string, done: boolean) {
    setState((prev) => prev.map((t) => (t.id === id ? { ...t, done, auto: false } : t)));
    await fetch(`/api/watches/${watchId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "todo", todoId: id, done }),
    });
    router.refresh();
  }

  if (state.length === 0) return <p className="text-sm text-navy-400">Your checklist appears after the first check finishes.</p>;
  return (
    <ul className="space-y-2.5">
      {state.map((t) => (
        <li key={t.id}>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={t.done}
              onChange={(e) => void toggle(t.id, e.target.checked)}
              className="mt-1 h-4 w-4 accent-brass-500"
            />
            <span className={t.done ? "text-navy-400 line-through" : "text-navy-800"}>
              {t.text}
              {t.done && t.auto && <span className="ml-2 font-mono text-[10px] uppercase text-emerald-700">Fixed</span>}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
