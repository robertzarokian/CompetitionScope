import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/site/LegalPage";
import { CONTACT_NOTE, LEGAL_UPDATED } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund and Cancellation Policy",
  description: "How cancellation works and when you can get a refund on a CompetitionScope plan.",
  alternates: { canonical: "/refunds" },
};

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Refund and Cancellation Policy"
      intro="We want you to be happy with your plan. Here is exactly how cancelling and refunds work."
      updated={LEGAL_UPDATED}
      sections={[
        {
          heading: "Try it free first",
          body: [
            <>Every account can preview a report and run an AI visibility audit for free, so you can see the quality before paying. See the <Link className="text-brass-600 underline" href="/sample-report">sample report</Link>.</>,
          ],
        },
        {
          heading: "7 day money-back guarantee",
          body: [
            "If you are not satisfied with a new paid plan, ask for a refund within 7 days of your first payment and we will refund that payment in full. This applies to monthly and yearly plans.",
          ],
        },
        {
          heading: "Cancel anytime",
          body: [
            "You can cancel from your dashboard whenever you like. Your plan stays active until the end of the period you have paid for, and it will not renew. After the first 7 days, we do not refund the rest of a billing period that has already started, but you keep full access until it ends.",
          ],
        },
        {
          heading: "Renewals",
          body: [
            "Plans renew automatically, so cancel before your renewal date if you do not want to continue. If you were charged for a renewal by mistake, contact us within 7 days and we will review it and, if it is fair, refund it.",
          ],
        },
        {
          heading: "Billing mistakes",
          body: [
            "If you were charged twice or the wrong amount, we will correct it and refund the difference.",
          ],
        },
        {
          heading: "How to ask",
          body: [
            <>{CONTACT_NOTE}, with the email address on your account. Approved refunds go back to your original payment method through Stripe and usually appear within 5 to 10 business days. See also our <Link className="text-brass-600 underline" href="/terms">Terms of Service</Link>.</>,
          ],
        },
      ]}
    />
  );
}
