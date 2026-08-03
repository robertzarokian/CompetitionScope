"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogoMark } from "@/components/Logo";
import { useOnboardingStore } from "@/lib/onboardingStore";
import { QUESTIONS } from "@/lib/questions";
import type { OnboardingAnswers } from "@/lib/types";

const STATUS_MESSAGES = [
  "Pointing the scope at your market...",
  "Scanning the web for your closest competitors...",
  "Reading their pricing pages and positioning...",
  "Sizing up their marketing and advertising channels...",
  "Cross-referencing what's working across all of them...",
  "Ranking your competitors by strength...",
  "Building your prioritized roadmap...",
  "Bringing it into focus...",
];

const MIN_DISPLAY_MS = 6500;

export function LoadingScreen() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function checkAndStart() {
      if (startedRef.current) return;
      const current = useOnboardingStore.getState().answers;
      const requiredIds = QUESTIONS.filter((q) => q.required).map((q) => q.id);
      const missing = requiredIds.some(
        (id) => !current[id as keyof typeof current]
      );
      if (missing) {
        router.replace("/onboarding/1");
        return;
      }
      startedRef.current = true;
      runGeneration(current);
    }

    async function runGeneration(answers: Partial<OnboardingAnswers>) {
      const start = Date.now();
      try {
        const res = await fetch("/api/report/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(answers),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Something went wrong generating your report.");
        }
        const elapsed = Date.now() - start;
        const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
        setTimeout(() => {
          useOnboardingStore.getState().setReportId(data.reportId);
          router.push(`/report/${data.reportId}`);
        }, wait);
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      }
    }

    // The onboarding store persists to localStorage and rehydrates
    // asynchronously. On a fresh page load (e.g. a hard refresh on this
    // route), running the required-fields check before hydration finishes
    // would see an empty `answers` and incorrectly bounce back to question 1.
    if (!useOnboardingStore.persist.hasHydrated()) {
      const unsub = useOnboardingStore.persist.onFinishHydration(() => {
        unsub();
        checkAndStart();
      });
      return unsub;
    }
    checkAndStart();
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="relative mb-10 flex h-28 w-28 items-center justify-center">
        <div className="scope-pulse absolute inset-0 rounded-full bg-brass-400/15 blur-2xl" />
        <div className="absolute inset-0 rounded-full border border-brass-400/30" />
        <LogoMark size={68} />
      </div>

      <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">
        Calculating your CompetitionScope
      </h1>
      <p className="mt-3 max-w-sm text-sm text-navy-500">
        This usually takes under a minute. We&rsquo;re doing real work — not a
        spinner for show.
      </p>

      <div className="mt-8 min-h-[2.5rem] border border-navy-300 bg-cream-50 px-5 py-2.5">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="font-mono text-xs uppercase tracking-wide text-brass-600"
        >
          {STATUS_MESSAGES[messageIndex]}
        </motion.p>
      </div>

      {errorMsg && (
        <div className="mt-8 max-w-sm rounded-sm border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
