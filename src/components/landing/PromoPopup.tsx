"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/Button";

const SEEN_KEY = "cs_promo_seen";
const HIDE_DAYS = 14;

type Stage = "form" | "done";

// First-visit offer on the home page: an email gets a personal 25% off code
// for the first month. It can be closed with the X, the Escape key, or a click
// outside, and stays closed for two weeks.
export function PromoPopup() {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shownCode, setShownCode] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remember = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, String(Date.now()));
    } catch {
      /* storage may be unavailable */
    }
  }, []);

  const close = useCallback(() => {
    remember();
    setOpen(false);
  }, [remember]);

  useEffect(() => {
    let seen = 0;
    try {
      seen = Number(localStorage.getItem(SEEN_KEY) ?? 0);
    } catch {
      /* ignore */
    }
    if (seen && Date.now() - seen < HIDE_DAYS * 86_400_000) return;
    const t = window.setTimeout(() => setOpen(true), 1200);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/promo/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setShownCode(data.code ?? null);
      remember();
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/70 px-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-title"
        className="instrument-panel card-glow relative w-full max-w-md overflow-hidden p-7 sm:p-8"
      >
        <div className="blueprint-grid absolute inset-0 opacity-40" aria-hidden="true" />
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center text-cream-200 transition-colors hover:text-brass-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-400"
        >
          <X size={20} />
        </button>

        <div className="relative">
          {stage === "form" ? (
            <>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass-300">Welcome offer</p>
              <h2 id="promo-title" className="mt-2 font-display text-3xl font-semibold leading-tight text-cream-50">
                Get 25% off your first month
              </h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-cream-200">
                Enter your email and we will send you a personal discount code for any monthly plan. It takes five seconds.
              </p>
              <form onSubmit={submit} className="mt-5">
                <label htmlFor="promo-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="promo-email"
                  ref={inputRef}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  maxLength={200}
                  className="w-full border border-navy-600 bg-cream-50 px-3.5 py-3 text-sm text-navy-800 placeholder:text-navy-300 focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-500/30"
                />
                {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
                <Button type="submit" size="lg" className="mt-3 w-full" disabled={busy || !email.trim()}>
                  {busy && <Loader2 size={15} className="animate-spin" />}
                  Send my code
                </Button>
              </form>
              <p className="mt-3 text-[11.5px] leading-relaxed text-cream-300">
                One email with your code, nothing else. First month only, then your plan renews at the normal price. New
                subscribers, monthly billing.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-cream-300 underline underline-offset-4 hover:text-brass-300"
              >
                No thanks
              </button>
            </>
          ) : (
            <>
              <span className="flex h-10 w-10 items-center justify-center bg-brass-400 text-navy-950">
                <Check size={20} />
              </span>
              <h2 id="promo-title" className="mt-4 font-display text-3xl font-semibold leading-tight text-cream-50">
                {shownCode ? "Here is your code" : "Check your inbox"}
              </h2>
              {shownCode ? (
                <>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-cream-200">
                    We could not email it just now, so save it here. It takes 25% off your first month.
                  </p>
                  <p className="mt-4 border-2 border-dashed border-brass-400 bg-navy-900/60 px-4 py-3 text-center font-mono text-2xl font-semibold tracking-[0.18em] text-brass-300">
                    {shownCode}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-[14.5px] leading-relaxed text-cream-200">
                  Your personal 25% off code is on its way to {email}. It can take a minute, so check your spam folder if it
                  does not show up.
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href={shownCode ? `/pricing?code=${encodeURIComponent(shownCode)}` : "/pricing"}
                  onClick={close}
                  className="inline-flex items-center justify-center rounded-sm border border-brass-300 bg-brass-400 px-6 py-3 text-[13px] font-medium uppercase tracking-[0.05em] text-navy-950 shadow-[0_4px_0_0_rgba(90,66,32,0.9)] transition hover:bg-brass-300"
                >
                  See plans
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="font-mono text-[11px] uppercase tracking-[0.12em] text-cream-300 underline underline-offset-4 hover:text-brass-300"
                >
                  Keep browsing
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
