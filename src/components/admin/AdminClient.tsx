"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

async function send(url: string, method: string, body?: object) {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, error: (data.error as string | undefined) ?? null };
}

const field = "w-full border border-navy-600 bg-cream-50 px-3.5 py-2.5 text-sm text-navy-800 focus:border-brass-500 focus:outline-none";

export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const r = await send("/api/admin/login", "POST", { username: form.get("username"), password: form.get("password") });
    if (r.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError(r.error ?? "Could not sign in.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-navy-800">Username</label>
        <input id="username" name="username" autoComplete="username" required className={`${field} mt-1.5`} />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-navy-800">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={`${field} mt-1.5`} />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in" : "Sign in"}</Button>
    </form>
  );
}

export function AdminLogout() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-brass-600 hover:underline"
      onClick={async () => {
        await send("/api/admin/logout", "POST");
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

export function PlanSelect({ userId, plan }: { userId: string; plan: string }) {
  const router = useRouter();
  const [value, setValue] = useState(plan);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select value={value} onChange={(e) => setValue(e.target.value)} className={`${field} w-auto`}>
        {["free", "starter", "growth", "agency"].map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <Button
        size="sm"
        onClick={async () => {
          if (!window.confirm(`Set this account to the ${value} plan? This does not change anything in Stripe.`)) return;
          const r = await send(`/api/admin/users/${userId}/plan`, "POST", { plan: value });
          setMessage(r.ok ? "Saved." : (r.error ?? "Failed."));
          router.refresh();
        }}
      >
        Set plan
      </Button>
      {message && <span className="text-xs text-navy-500">{message}</span>}
    </div>
  );
}

export function AdminManager({ admins, selfId }: { admins: { id: string; username: string; disabled: boolean; createdBy: string | null; createdAt: string }[]; selfId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await send("/api/admin/admins", "POST", { username: f.get("username"), password: f.get("password") });
    setMessage(r.ok ? "Admin created." : (r.error ?? "Failed."));
    if (r.ok) {
      form.reset();
      router.refresh();
    }
  }

  async function patch(body: object, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    const r = await send("/api/admin/admins", "PATCH", body);
    setMessage(r.ok ? "Done." : (r.error ?? "Failed."));
    router.refresh();
  }

  async function changeOwn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await send("/api/admin/password", "POST", { current: f.get("current"), next: f.get("next") });
    setMessage(r.ok ? "Your password was changed." : (r.error ?? "Failed."));
    if (r.ok) form.reset();
  }

  return (
    <div className="space-y-8">
      <ul className="divide-y divide-navy-300/60">
        {admins.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span>
              <span className="font-medium text-navy-800">{a.username}</span>
              {a.id === selfId && <span className="ml-2 font-mono text-[10px] uppercase text-brass-600">You</span>}
              {a.disabled && <span className="ml-2 font-mono text-[10px] uppercase text-red-700">Disabled</span>}
              <span className="ml-3 text-xs text-navy-400">added {a.createdAt}{a.createdBy ? ` by ${a.createdBy}` : ""}</span>
            </span>
            {a.id !== selfId && (
              <span className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => {
                  const pw = window.prompt(`New password for ${a.username} (at least 12 characters):`);
                  if (pw) void patch({ action: "password", id: a.id, password: pw });
                }}>Reset password</Button>
                {a.disabled ? (
                  <Button size="sm" variant="secondary" onClick={() => void patch({ action: "enable", id: a.id })}>Enable</Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => void patch({ action: "disable", id: a.id }, `Disable ${a.username}? They will be signed out.`)}>Disable</Button>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={create} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="block text-sm font-medium text-navy-800">New admin username</label>
          <input name="username" required className={`${field} mt-1.5`} autoComplete="off" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-800">Password (12+ characters)</label>
          <input name="password" type="password" required minLength={12} className={`${field} mt-1.5`} autoComplete="new-password" />
        </div>
        <Button type="submit">Create admin</Button>
      </form>

      <form onSubmit={changeOwn} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="block text-sm font-medium text-navy-800">Your current password</label>
          <input name="current" type="password" required className={`${field} mt-1.5`} autoComplete="current-password" />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy-800">New password (12+ characters)</label>
          <input name="next" type="password" required minLength={12} className={`${field} mt-1.5`} autoComplete="new-password" />
        </div>
        <Button type="submit" variant="secondary">Change my password</Button>
      </form>
      {message && <p className="text-sm text-navy-600">{message}</p>}
    </div>
  );
}
