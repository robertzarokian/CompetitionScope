export interface OnboardingAnswers {
  companyName: string;
  website: string;
  category: string;
  description: string;
  struggles: string;
  salesConfidence: string;
  potentialGap: string;
  knownCompetitors: string;
  marketingChannels: string[];
  email: string;
}

export interface CompetitorProfile {
  name: string;
  website: string;
  matchScore: number; // 0-100, how close a competitor this is
  ranking: number; // 1 = strongest performer among the set
  summary: string;
  estimatedSalesTier: string; // e.g. "$10M-$25M ARR (estimated)"
  salesStrategy: string;
  advertisingChannels: string[];
  strengths: string[];
  successFactors: string[]; // why this competitor is winning
}

export interface SuccessFactor {
  title: string;
  description: string;
  competitorsSharingIt: number; // how many of the researched competitors show this trait
}

export interface RoadmapItem {
  priority: number;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
}

export interface CompetitionScopeReport {
  id: string;
  ownerUserId: string | null;
  createdAt: string;
  status: "pending" | "ready" | "error";
  unlocked: boolean;
  source: "ai" | "mock";
  answers: OnboardingAnswers;
  executiveSummary: string;
  competitors: CompetitorProfile[];
  successFactors: SuccessFactor[];
  roadmap: RoadmapItem[];
  freeTeaserInsight: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface PurchaseRecord {
  reportId: string;
  userId: string;
  amountCents: number;
  createdAt: string;
  mode: "stripe" | "payment-link" | "demo";
}

export interface Database {
  users: User[];
  reports: CompetitionScopeReport[];
  purchases: PurchaseRecord[];
}
