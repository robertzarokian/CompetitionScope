"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/Button";
import { REPORT_PRICE_LABEL } from "@/lib/pricing";

type Mode = "loading" | "stripe-redirecting" | "demo" | "already-unlocked" | "error";

export function CheckoutClient({
  reportId,
  companyName,
}: {
  reportId: string;
  companyName: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/checkout/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not start checkout.");

        if (data.mode === "stripe") {
          setMode("stripe-redirecting");
          window.location.href = data.url;
        } else if (data.mode === "already-unlocked") {
          setMode("already-unlocked");
          router.push(`/report/${reportId}/full`);
        } else {
          setMode("demo");
        }
      } catch (err) {
        setMode("error");
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  async function handleDemoPay(e: React.FormEvent) {
    e.preventDefault();
    setPaying(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/confirm-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed.");
      router.push(`/report/${reportId}/full?purchased=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
      setPaying(false);
    }
  }

  if (mode === "loading" || mode === "stripe-redirecting" || mode === "already-unlocked") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <div className="scope-pulse h-3 w-3 rounded-full bg-brass-400" />
        <p className="mt-4 font-mono text-xs uppercase tracking-wide text-navy-400">
          {mode === "stripe-redirecting"
            ? "Redirecting you to secure checkout..."
            : "Preparing checkout..."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
      <div className="card-glow paper-panel border border-navy-600 p-6">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-navy-400">
          Order summary
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-navy-800">CompetitionScope Report</span>
          <span className="font-display text-lg font-semibold text-navy-800">
            {REPORT_PRICE_LABEL}
          </span>
        </div>
        <p className="mt-1 text-xs text-navy-400">for {companyName}</p>

        <div className="mt-5 space-y-2.5 border-t border-navy-600 pt-5 text-sm text-navy-500">
          {[
            "Every competitor, fully detailed",
            "All shared success factors",
            "Your full prioritized roadmap",
            "Branded PDF export",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <ShieldCheck size={15} className="shrink-0 text-brass-500" />
              {item}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 border border-navy-300 bg-cream-200 px-3.5 py-2.5 text-xs text-navy-400">
          <Lock size={13} />
          One-time payment. No subscription, cancel anytime because there&rsquo;s
          nothing to cancel.
        </div>
      </div>

      <div className="card-glow paper-panel border border-navy-600 p-6">
        <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-brass-600">
          <Sparkles size={14} />
          Demo checkout mode — no Stripe key configured
        </div>
        <p className="mb-5 text-xs text-navy-400">
          This is a working demo of the payment flow. Enter anything below — no
          card is charged. Add a <code className="text-navy-500">STRIPE_SECRET_KEY</code>{" "}
          to switch to real payments.
        </p>

        <form onSubmit={handleDemoPay} className="space-y-3.5">
          <input
            required
            placeholder="Name on card"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            className="w-full rounded-sm border border-navy-300 bg-cream-50 px-4 py-3 text-sm text-navy-800 placeholder:text-navy-300 outline-none focus:border-brass-500 focus:ring-2 focus:ring-brass-400/20"
          />
          <div className="relative">
            <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              required
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full rounded-sm border border-navy-300 bg-cream-50 py-3 pl-11 pr-4 text-sm text-navy-800 placeholder:text-navy-300 outline-none focus:border-brass-500 focus:ring-2 focus:ring-brass-400/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="MM / YY"
              value={cardExpiry}
              onChange={(e) => setCardExpiry(e.target.value)}
              className="w-full rounded-sm border border-navy-300 bg-cream-50 px-4 py-3 text-sm text-navy-800 placeholder:text-navy-300 outline-none focus:border-brass-500 focus:ring-2 focus:ring-brass-400/20"
            />
            <input
              required
              inputMode="numeric"
              placeholder="CVC"
              value={cardCvc}
              onChange={(e) => setCardCvc(e.target.value)}
              className="w-full rounded-sm border border-navy-300 bg-cream-50 px-4 py-3 text-sm text-navy-800 placeholder:text-navy-300 outline-none focus:border-brass-500 focus:ring-2 focus:ring-brass-400/20"
            />
          </div>

          {error && (
            <p className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={paying} className="w-full" size="md">
            {paying ? "Processing..." : `Pay ${REPORT_PRICE_LABEL}`}
          </Button>
        </form>
      </div>
    </div>
  );
}
