"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/Button";
import { PLANS, formatPrice, type BillingInterval, type PlanId } from "@/lib/plans";

const ORDER: PlanId[] = ["free", "starter", "growth", "agency"];

export function PlanGrid({
  currentPlan,
  loggedIn,
  autoPlan,
  initialCode,
}: {
  currentPlan: PlanId;
  loggedIn: boolean;
  // A plan chosen before logging in, resumed after sign-up.
  autoPlan?: { plan: PlanId; interval: BillingInterval } | null;
  // A discount code from an email link, filled in for the customer to apply.
  initialCode?: string;
}) {
  const [interval, setInterval] = useState<BillingInterval>(autoPlan?.interval ?? "month");
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState(!!initialCode);
  const [codeInput, setCodeInput] = useState(initialCode ?? "");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ code: string; percent: number } | null>(null);

  async function applyCode() {
    setCodeError(null);
    setCodeBusy(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: codeInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error ?? "That code is not valid.");
      setApplied({ code: codeInput.trim().toUpperCase(), percent: data.percent });
    } catch (e) {
      setApplied(null);
      setCodeError(e instanceof Error ? e.message : "That code could not be checked.");
    } finally {
      setCodeBusy(false);
    }
  }

  async function choose(plan: PlanId) {
    setError(null);
    if (applied && interval === "year" && currentPlan === "free") {
      setError("Your discount code works on monthly billing. Switch to Monthly to use it.");
      return;
    }
    setBusy(plan);
    try {
      // Someone already subscribed changes or cancels in the billing portal.
      const res = await fetch(currentPlan === "free" ? "/api/billing/checkout" : "/api/billing/portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan, interval, code: applied && interval === "month" ? applied.code : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.mode === "manage") {
        const portal = await fetch("/api/billing/portal", { method: "POST" });
        const p = await portal.json().catch(() => ({}));
        if (p.url) return void window.location.assign(p.url);
        throw new Error(p.error ?? "The billing page could not be opened.");
      }
      if (data.mode === "demo") return void window.location.assign("/dashboard");
      if (data.url) return void window.location.assign(data.url);
      throw new Error(data.error ?? "Something went wrong. Please try again.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Billing period" className="inline-flex border border-navy-600">
          {(["month", "year"] as const).map((i) => (
            <button
              key={i}
              type="button"
              aria-pressed={interval === i}
              onClick={() => setInterval(i)}
              className={`px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/60 ${
                interval === i ? "bg-navy-800 text-cream-50" : "bg-cream-50 text-navy-700 hover:text-navy-900"
              }`}
            >
              {i === "month" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600">
          Yearly: 2 months free
        </span>
      </div>

      {currentPlan === "free" && (
        <div className="mb-6 max-w-xl">
          {!codeOpen && !applied ? (
            <button
              type="button"
              onClick={() => setCodeOpen(true)}
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-brass-600 underline underline-offset-4"
            >
              Have a discount code?
            </button>
          ) : applied ? (
            <p className="flex flex-wrap items-center gap-3 border border-emerald-700/30 bg-emerald-700/10 px-3.5 py-2.5 text-sm text-emerald-800">
              <Check size={15} />
              <span>
                Code <span className="font-mono font-semibold">{applied.code}</span> applied: {applied.percent}% off your first month, then the normal price.
              </span>
              <button
                type="button"
                onClick={() => {
                  setApplied(null);
                  setCodeInput("");
                }}
                className="font-mono text-[11px] uppercase tracking-[0.1em] underline underline-offset-4"
              >
                Remove
              </button>
            </p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (codeInput.trim()) void applyCode();
              }}
            >
              <label htmlFor="promo-code" className="block text-sm font-medium text-navy-800">
                Discount code <span className="font-normal text-navy-400">(optional)</span>
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="promo-code"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="SCOPE-XXXXXX"
                  maxLength={40}
                  autoComplete="off"
                  className="min-w-0 flex-1 border border-navy-600 bg-cream-50 px-3.5 py-2.5 font-mono text-sm uppercase text-navy-800 placeholder:text-navy-300 focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-500/30"
                />
                <Button type="submit" variant="secondary" disabled={codeBusy || !codeInput.trim()}>
                  {codeBusy && <Loader2 size={14} className="animate-spin" />}
                  Apply
                </Button>
              </div>
              {codeError && <p className="mt-1.5 text-xs text-red-700">{codeError}</p>}
            </form>
          )}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ORDER.map((id) => {
          const plan = PLANS[id];
          const featured = id === "growth";
          const current = id === currentPlan;
          const dark = featured;
          return (
            <div
              key={id}
              className={`flex flex-col p-6 ${dark ? "instrument-panel card-glow" : "paper-panel border border-navy-600"}`}
            >
              <div className="flex items-baseline justify-between">
                <p className={`font-mono text-[11px] uppercase tracking-[0.18em] ${dark ? "text-brass-400" : "text-navy-400"}`}>
                  {plan.name}
                </p>
                {featured && (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-brass-300">Most popular</span>
                )}
              </div>
              <p className={`mt-3 font-display text-4xl font-semibold ${dark ? "text-cream-50" : "text-navy-800"}`}>
                {id === "free"
                  ? "$0"
                  : formatPrice(interval === "month" ? plan.monthlyCents : Math.round(plan.annualCents / 12))}
                {id !== "free" && (
                  <span className={`ml-1 font-sans text-sm font-normal ${dark ? "text-cream-300" : "text-navy-400"}`}>
                    /month
                  </span>
                )}
              </p>
              <p className={`mt-1 min-h-[2.5rem] text-xs ${dark ? "text-cream-300" : "text-navy-400"}`}>
                {id === "free"
                  ? plan.tagline
                  : interval === "year"
                    ? `Billed ${formatPrice(plan.annualCents)} a year`
                    : applied
                      ? `First month ${formatPrice(Math.round(plan.monthlyCents * (1 - applied.percent / 100)))}, then ${formatPrice(plan.monthlyCents)}/month`
                      : plan.tagline}
              </p>
              <ul className="mt-4 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className={`flex gap-2.5 text-[13.5px] leading-snug ${dark ? "text-cream-100" : "text-navy-700"}`}>
                    <Check size={15} className={`mt-0.5 shrink-0 ${dark ? "text-brass-300" : "text-brass-500"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {id === "free" ? (
                  <Link
                    href="/onboarding/1"
                    className="inline-flex w-full items-center justify-center rounded-sm border border-navy-600 bg-cream-50 px-4 py-3 text-[13px] font-medium uppercase tracking-[0.05em] text-navy-800 transition hover:border-brass-500"
                  >
                    {current && loggedIn ? "Your plan" : "Start free"}
                  </Link>
                ) : current ? (
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-sm border border-brass-400/50 px-4 py-3 text-[13px] font-medium uppercase tracking-[0.05em] text-brass-600 opacity-80"
                  >
                    Your plan
                  </button>
                ) : loggedIn ? (
                  <Button className="w-full" onClick={() => void choose(id)} disabled={busy !== null}>
                    {busy === id && <Loader2 size={14} className="animate-spin" />}
                    {currentPlan === "free" ? `Choose ${plan.name}` : "Change plan"}
                  </Button>
                ) : (
                  <Link
                    href={`/auth?next=${encodeURIComponent(`/pricing?plan=${id}&interval=${interval}${applied ? `&code=${applied.code}` : ""}`)}`}
                    className="inline-flex w-full items-center justify-center rounded-sm border border-brass-300 bg-brass-400 px-4 py-3 text-[13px] font-medium uppercase tracking-[0.05em] text-navy-950 shadow-[0_4px_0_0_rgba(90,66,32,0.9)] transition hover:bg-brass-300"
                  >
                    Choose {plan.name}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {autoPlan && loggedIn && currentPlan === "free" && (
        <p className="mt-4 text-sm text-navy-500">
          You chose the {PLANS[autoPlan.plan].name} plan before signing up. Click &ldquo;Choose {PLANS[autoPlan.plan].name}&rdquo; to continue.
        </p>
      )}
    </div>
  );
}
