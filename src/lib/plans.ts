export type PlanId = "free" | "starter" | "growth" | "agency";
export type BillingInterval = "month" | "year";

export interface PlanLimits {
  // Unlocks the full competitor report (the free plan only gets the preview).
  fullReports: boolean;
  // Downloadable PDF of a report.
  pdf: boolean;
  // Replace the CompetitionScope name on PDFs with the customer's own brand.
  whiteLabel: boolean;
  // How many companies can be monitored.
  clients: number;
  // Total AI questions tracked across all monitored companies.
  questions: number;
  // Competitors tracked per company.
  competitors: number;
  // Days between automatic re-checks (0 = no monitoring).
  checkEveryDays: number;
  // Re-check the website and backlinks too, not just the AI answers.
  websiteMonitoring: boolean;
  // Email alerts when something changes.
  emailAlerts: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyCents: number;
  // Two months free: twelve months for the price of ten.
  annualCents: number;
  features: string[];
  limits: PlanLimits;
}

const annual = (monthlyCents: number) => monthlyCents * 10;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Try it before you pay",
    monthlyCents: 0,
    annualCents: 0,
    features: ["Preview report with your first competitor", "Executive summary and first insight"],
    limits: {
      fullReports: false,
      pdf: false,
      whiteLabel: false,
      clients: 0,
      questions: 0,
      competitors: 3,
      checkEveryDays: 0,
      websiteMonitoring: false,
      emailAlerts: false,
    },
  },
  starter: {
    id: "starter",
    name: "Starter",
    tagline: "Stay on top of one company",
    monthlyCents: 1799,
    annualCents: annual(1799),
    features: [
      "Full competitor reports",
      "Monthly competitor refresh",
      "Monthly AI visibility check on 3 questions",
      "Trend lines and history",
      "Change alerts by email",
      "Progress checklist",
    ],
    limits: {
      fullReports: true,
      pdf: false,
      whiteLabel: false,
      clients: 1,
      questions: 3,
      competitors: 3,
      checkEveryDays: 30,
      websiteMonitoring: false,
      emailAlerts: true,
    },
  },
  growth: {
    id: "growth",
    name: "Growth",
    tagline: "Weekly tracking for serious competition",
    monthlyCents: 3499,
    annualCents: annual(3499),
    features: [
      "Everything in Starter",
      "Weekly checks",
      "10 AI questions",
      "Up to 5 competitors tracked",
      "Website and backlink monitoring",
      "PDF reports",
    ],
    limits: {
      fullReports: true,
      pdf: true,
      whiteLabel: false,
      clients: 1,
      questions: 10,
      competitors: 5,
      checkEveryDays: 7,
      websiteMonitoring: true,
      emailAlerts: true,
    },
  },
  agency: {
    id: "agency",
    name: "Agency",
    tagline: "Run it for your clients",
    monthlyCents: 9999,
    annualCents: annual(9999),
    features: [
      "Everything in Growth",
      "Up to 10 clients",
      "White-label PDF reports",
      "50 AI questions across your clients",
    ],
    limits: {
      fullReports: true,
      pdf: true,
      whiteLabel: true,
      clients: 10,
      questions: 50,
      competitors: 5,
      checkEveryDays: 7,
      websiteMonitoring: true,
      emailAlerts: true,
    },
  },
};

export const PAID_PLANS: PlanId[] = ["starter", "growth", "agency"];

export function isPlanId(value: string): value is PlanId {
  return value in PLANS;
}

export function priceCents(plan: Plan, interval: BillingInterval): number {
  return interval === "year" ? plan.annualCents : plan.monthlyCents;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

// Cheapest paid price per month, for "from $X/month" copy.
export const STARTING_PRICE_LABEL = formatPrice(PLANS.starter.monthlyCents);
