export type QuestionType =
  | "text"
  | "url"
  | "textarea"
  | "select"
  | "multiselect"
  | "email";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  step: number;
  type: QuestionType;
  title: string;
  helper?: string;
  placeholder?: string;
  options?: QuestionOption[];
  required: boolean;
  maxLength?: number;
}

export const QUESTIONS: Question[] = [
  {
    id: "email",
    step: 1,
    type: "email",
    title: "Where should we send your report?",
    helper: "We'll save your progress here and deliver your results the moment they're ready.",
    placeholder: "you@company.com",
    required: true,
  },
  {
    id: "companyName",
    step: 2,
    type: "text",
    title: "What's your company called?",
    helper: "The name we'll point the scope at.",
    placeholder: "e.g. Northstar Robotics",
    required: true,
    maxLength: 120,
  },
  {
    id: "website",
    step: 3,
    type: "url",
    title: "What's your company's website?",
    helper: "We'll use this to understand what you do and how you're positioned.",
    placeholder: "https://yourcompany.com",
    required: true,
  },
  {
    id: "category",
    step: 4,
    type: "select",
    title: "What category best describes your company?",
    helper: "This helps us search in the right neighborhood.",
    required: true,
    options: [
      { value: "saas", label: "SaaS / Software" },
      { value: "ecommerce", label: "E-commerce / DTC" },
      { value: "fintech", label: "Fintech / Financial Services" },
      { value: "healthcare", label: "Healthcare / Wellness" },
      { value: "marketplace", label: "Marketplace / Platform" },
      { value: "agency", label: "Agency / Professional Services" },
      { value: "hardware", label: "Hardware / Consumer Products" },
      { value: "food", label: "Food & Beverage" },
      { value: "real-estate", label: "Real Estate / PropTech" },
      { value: "education", label: "Education / EdTech" },
      { value: "media", label: "Media / Entertainment" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "description",
    step: 5,
    type: "textarea",
    title: "In a few sentences, what does your company provide?",
    helper: "Describe your product or service like you'd explain it to a new customer.",
    placeholder: "We build...",
    required: true,
    maxLength: 800,
  },
  {
    id: "struggles",
    step: 6,
    type: "textarea",
    title: "What are you struggling with most right now?",
    helper: "Be honest. This shapes what we look for in your competitors.",
    placeholder: "e.g. Our growth has stalled, we can't tell why customers churn...",
    required: true,
    maxLength: 800,
  },
  {
    id: "salesConfidence",
    step: 7,
    type: "select",
    title: "How do you think your sales are going?",
    required: true,
    options: [
      { value: "thriving", label: "Thriving: we're consistently beating targets" },
      { value: "steady", label: "Steady: predictable, but not exciting" },
      { value: "inconsistent", label: "Inconsistent: good months and bad months" },
      { value: "slipping", label: "Slipping: trending the wrong way" },
      { value: "struggling", label: "Struggling: we need a real change" },
    ],
  },
  {
    id: "potentialGap",
    step: 8,
    type: "select",
    title: "Is your company performing as well as you believe it could?",
    required: true,
    options: [
      { value: "maximizing", label: "Yes, we're close to our ceiling" },
      { value: "room-to-grow", label: "Somewhat, there's real room to grow" },
      { value: "leaving-on-table", label: "No, we're leaving a lot on the table" },
      { value: "not-sure", label: "Honestly not sure" },
    ],
  },
  {
    id: "knownCompetitors",
    step: 9,
    type: "textarea",
    title: "Who do you think your closest competitors are?",
    helper: "Optional. List any you already know. We'll find more.",
    placeholder: "e.g. Acme Co, RivalWorks, BetaCorp",
    required: false,
    maxLength: 400,
  },
  {
    id: "marketingChannels",
    step: 10,
    type: "multiselect",
    title: "Where do you currently focus your marketing or advertising?",
    helper: "Select all that apply.",
    required: true,
    options: [
      { value: "seo-content", label: "SEO / Content" },
      { value: "paid-search", label: "Paid Search" },
      { value: "paid-social", label: "Paid Social" },
      { value: "email", label: "Email Marketing" },
      { value: "partnerships", label: "Partnerships / Affiliates" },
      { value: "outbound", label: "Outbound Sales" },
      { value: "events", label: "Events / Conferences" },
      { value: "word-of-mouth", label: "Word of Mouth / Referral" },
      { value: "not-sure", label: "Not sure" },
    ],
  },
];

export const TOTAL_STEPS = QUESTIONS.length;

export function getQuestionByStep(step: number): Question | undefined {
  return QUESTIONS.find((q) => q.step === step);
}
