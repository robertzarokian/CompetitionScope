import { notFound, redirect } from "next/navigation";
import { getQuestionByStep, TOTAL_STEPS } from "@/lib/questions";
import { QuestionCard } from "@/components/onboarding/QuestionCard";

export default async function OnboardingStepPage({
  params,
}: PageProps<"/onboarding/[step]">) {
  const { step: stepParam } = await params;
  const step = Number(stepParam);

  if (!Number.isInteger(step) || step < 1) {
    notFound();
  }
  if (step > TOTAL_STEPS) {
    redirect("/onboarding/loading");
  }

  const question = getQuestionByStep(step);
  if (!question) {
    notFound();
  }

  return <QuestionCard question={question} totalSteps={TOTAL_STEPS} />;
}
