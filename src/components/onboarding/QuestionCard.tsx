"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Question } from "@/lib/questions";
import { useOnboardingStore } from "@/lib/onboardingStore";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/Button";

interface Props {
  question: Question;
  totalSteps: number;
}

export function QuestionCard({ question, totalSteps }: Props) {
  const router = useRouter();
  const answers = useOnboardingStore((s) => s.answers);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);

  const rawValue = answers[question.id as keyof typeof answers];
  const text = typeof rawValue === "string" ? rawValue : "";
  const multi = Array.isArray(rawValue) ? rawValue : [];

  const isValid = !question.required
    ? true
    : question.type === "multiselect"
      ? multi.length > 0
      : question.type === "email"
        ? /\S+@\S+\.\S+/.test(text)
        : text.trim().length > 0;

  function goNext() {
    if (!isValid) return;
    if (question.step >= totalSteps) {
      router.push("/onboarding/loading");
    } else {
      router.push(`/onboarding/${question.step + 1}`);
    }
  }

  function goBack() {
    if (question.step > 1) {
      router.push(`/onboarding/${question.step - 1}`);
    } else {
      router.push("/");
    }
  }

  function toggleMulti(value: string) {
    const next = multi.includes(value)
      ? multi.filter((v) => v !== value)
      : [...multi, value];
    setAnswer(question.id as keyof typeof answers, next);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && question.type !== "textarea") {
      e.preventDefault();
      goNext();
    }
  }

  return (
    <div>
      <ProgressBar current={question.step} total={totalSteps} />

      <motion.div
        key={question.id}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="mt-9"
      >
        <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">
          {question.title}
          {!question.required && (
            <span className="ml-2 align-middle font-mono text-xs font-normal uppercase tracking-wide text-navy-400">
              optional
            </span>
          )}
        </h1>
        {question.helper && (
          <p className="mt-3 text-sm text-navy-500">{question.helper}</p>
        )}

        <div className="mt-7" onKeyDown={handleKeyDown}>
          {(question.type === "text" ||
            question.type === "url" ||
            question.type === "email") && (
            <input
              autoFocus
              type={question.type === "url" ? "text" : question.type}
              value={text}
              maxLength={question.maxLength}
              placeholder={question.placeholder}
              onChange={(e) =>
                setAnswer(question.id as keyof typeof answers, e.target.value)
              }
              className="w-full rounded-sm border border-navy-300 bg-cream-50 px-5 py-4 text-base text-navy-800 placeholder:text-navy-300 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-400/20"
            />
          )}

          {question.type === "textarea" && (
            <textarea
              autoFocus
              value={text}
              maxLength={question.maxLength}
              placeholder={question.placeholder}
              onChange={(e) =>
                setAnswer(question.id as keyof typeof answers, e.target.value)
              }
              rows={5}
              className="w-full resize-none rounded-sm border border-navy-300 bg-cream-50 px-5 py-4 text-base text-navy-800 placeholder:text-navy-300 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-400/20"
            />
          )}

          {question.type === "select" && (
            <div className="grid gap-2">
              {question.options?.map((opt) => {
                const active = text === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setAnswer(question.id as keyof typeof answers, opt.value)
                    }
                    className={`flex items-center justify-between rounded-sm border px-5 py-3.5 text-left text-sm transition ${
                      active
                        ? "border-brass-500 bg-brass-400/10 text-navy-800"
                        : "border-navy-300 bg-cream-50 text-navy-500 hover:border-navy-400 hover:bg-cream-200"
                    }`}
                  >
                    {opt.label}
                    {active && <Check size={16} className="text-brass-400" />}
                  </button>
                );
              })}
            </div>
          )}

          {question.type === "multiselect" && (
            <div className="grid grid-cols-2 gap-2">
              {question.options?.map((opt) => {
                const active = multi.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleMulti(opt.value)}
                    className={`flex items-center justify-between gap-2 rounded-sm border px-4 py-3 text-left text-sm transition ${
                      active
                        ? "border-brass-500 bg-brass-400/10 text-navy-800"
                        : "border-navy-300 bg-cream-50 text-navy-500 hover:border-navy-400 hover:bg-cream-200"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {active && <Check size={15} className="shrink-0 text-brass-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      <div className="mt-9 flex items-center justify-between">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-navy-400 transition hover:text-brass-600"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <Button onClick={goNext} disabled={!isValid} size="lg">
          {question.step >= totalSteps ? "Generate my report" : "Continue"}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
