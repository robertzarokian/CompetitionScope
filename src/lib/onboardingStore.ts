"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingAnswers } from "./types";

interface OnboardingState {
  answers: Partial<OnboardingAnswers>;
  reportId: string | null;
  setAnswer: (key: keyof OnboardingAnswers, value: string | string[]) => void;
  setReportId: (id: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      answers: {},
      reportId: null,
      setAnswer: (key, value) =>
        set((state) => ({ answers: { ...state.answers, [key]: value } })),
      setReportId: (id) => set({ reportId: id }),
      reset: () => set({ answers: {}, reportId: null }),
    }),
    { name: "competitionscope-onboarding" }
  )
);
