import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { CONTACT_NOTE, LEGAL_UPDATED } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using CompetitionScope, including plans, billing, acceptable use, and our limits of liability.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      intro="By using CompetitionScope you agree to these terms. Please read them."
      updated={LEGAL_UPDATED}
      sections={[
        {
          heading: "The service",
          body: [
            "CompetitionScope researches competitors and AI visibility using AI and publicly available web data, and produces reports, audits, and alerts. Features depend on your plan.",
          ],
        },
        {
          heading: "Accounts",
          body: [
            "You must give accurate information and keep your login private. You are responsible for activity on your account. You must be at least 16 and be using the service for business purposes.",
          ],
        },
        {
          heading: "Plans, billing, and cancellation",
          body: [
            <>Paid plans are subscriptions billed monthly or yearly in advance through Stripe, and renew automatically until cancelled. Prices are shown on our <Link className="text-brass-600 underline" href="/pricing">pricing page</Link> and may change for future periods with notice. You can cancel anytime from your dashboard and keep access until the end of the period you paid for. Refunds are covered by our <Link className="text-brass-600 underline" href="/refunds">Refund Policy</Link>.</>,
          ],
        },
        {
          heading: "Results are not guarantees",
          body: [
            "Reports and audits are produced by AI from live web data and can contain errors or out-of-date information. Revenue, scale, and similar figures are estimates. AI assistants give different answers at different times, and we cannot guarantee that any assistant will recommend your business or that any change you make will improve results. Check details that matter before making business decisions.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "Do not misuse the service. That includes trying to break or overload it, bypass limits, access other people's data, scrape or resell our output as your own competing service (except as allowed by the Agency plan for your own clients), run audits on websites you have no right to check, or break the law. We may suspend accounts that do.",
          ],
        },
        {
          heading: "Your content and ours",
          body: [
            "You keep ownership of what you submit. You give us permission to process it to provide the service, including sending it to our AI and data providers. We own the CompetitionScope software, design, and brand. You may use your reports for your own business, and Agency customers may share them with their clients.",
          ],
        },
        {
          heading: "Third-party services",
          body: [
            "The service relies on third parties such as AI providers, payment processors, and data sources. We are not responsible for their outages or changes, and some features may change or pause because of them.",
          ],
        },
        {
          heading: "Limits of liability",
          body: [
            "The service is provided as is, without warranties of any kind to the extent the law allows. To the fullest extent the law allows, CompetitionScope is not liable for indirect, incidental, or lost-profit damages, and our total liability for any claim is limited to the amount you paid us in the 12 months before the claim. Some places do not allow these limits, so they apply only as far as the law permits.",
          ],
        },
        {
          heading: "Changes and ending service",
          body: [
            "We may update these terms or the service. Continuing to use it after changes means you accept them. You may stop using it at any time, and we may suspend or end accounts that break these terms.",
          ],
        },
        {
          heading: "Contact",
          body: [
            <>Questions about these terms? {CONTACT_NOTE}. Our <Link className="text-brass-600 underline" href="/privacy">Privacy Policy</Link> explains how we handle your data.</>,
          ],
        },
      ]}
    />
  );
}
