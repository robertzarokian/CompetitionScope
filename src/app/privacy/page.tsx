import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { CONTACT_NOTE, LEGAL_UPDATED, LINKEDIN_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What CompetitionScope collects, why, who it is shared with, and how you can access or delete your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="Plain answers about what we collect, why we collect it, and the choices you have."
      updated={LEGAL_UPDATED}
      sections={[
        {
          heading: "What we collect",
          body: [
            "Account details: your email address and a password. We never store your password itself, only a scrambled version that cannot be read back.",
            "What you tell us: your answers when you create a report or run an audit, such as your company name, website, what you sell, where you struggle, competitors you know, and the questions you want AI to answer.",
            "Payment details: handled entirely by Stripe. Your card number never reaches our servers. We keep only your plan, billing period, and subscription status.",
            "Discount signups: if you enter your email in our welcome popup, we store it with the single-use discount code we create for you and email that code to you. Only people who use the popup get a code.",
            "Technical details: your IP address and basic request data, used to prevent abuse, limit repeated requests, and keep the service secure. We use a login cookie to keep you signed in. We do not use advertising cookies.",
          ],
        },
        {
          heading: "How we use it",
          body: [
            "To create your reports and audits, run the automatic re-checks you pay for, send alerts and account emails, process payments, answer your messages, prevent fraud and abuse, and improve the service.",
            "We do not sell your personal information.",
          ],
        },
        {
          heading: "Who we share it with",
          body: [
            "We use trusted service providers to run CompetitionScope, and they only receive what they need: Stripe (payments), Anthropic and, when enabled, other AI providers (to research and write your reports and to ask AI assistants your audit questions), Google (website speed tests), a backlink data provider (website domains you and your competitors use), Neon (our database), Vercel (hosting), and Resend (emails).",
            "Your company details and questions are sent to the AI providers so they can produce your results. Do not enter anything you would not want processed by them, such as passwords or private customer data.",
            "We may disclose information if the law requires it or to protect our rights and users.",
          ],
        },
        {
          heading: "How long we keep it",
          body: [
            "We keep your account and reports while your account is open. Reports made without an account are kept so their link keeps working, and you can ask us to delete them. If you ask us to delete your account, we delete your personal data, except records we must keep for tax, accounting, or legal reasons.",
          ],
        },
        {
          heading: "Your choices and rights",
          body: [
            "You can ask to see, correct, export, or delete your data at any time. Depending on where you live, laws such as the GDPR and the California Consumer Privacy Act give you these rights formally. You can also unsubscribe from alert emails and cancel your plan from your dashboard.",
            <>To make a request, {CONTACT_NOTE} (<a className="text-brass-600 underline" href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">LinkedIn</a>). We will respond within 30 days.</>,
          ],
        },
        {
          heading: "Security",
          body: [
            "We protect data with encrypted connections, hashed passwords, limits on login attempts, and restricted admin access. No system is perfectly secure, so we cannot promise absolute security.",
          ],
        },
        {
          heading: "Children",
          body: ["CompetitionScope is for businesses and is not meant for anyone under 16. We do not knowingly collect their data."],
        },
        {
          heading: "Changes",
          body: [
            <>We may update this policy. The date above shows the latest version. Our <Link className="text-brass-600 underline" href="/terms">Terms of Service</Link> and <Link className="text-brass-600 underline" href="/refunds">Refund Policy</Link> also apply.</>,
          ],
        },
      ]}
    />
  );
}
