import { notFound, redirect } from "next/navigation";
import { readDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { LogoWatermark } from "@/components/decor/LogoWatermark";

export default async function CheckoutPage({ params }: PageProps<"/checkout/[id]">) {
  const { id } = await params;
  const db = await readDb();
  const report = db.reports.find((r) => r.id === id);
  if (!report) notFound();
  if (report.unlocked) redirect(`/report/${id}/full`);

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/checkout/${id}`)}`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden pb-24">
      <LogoWatermark className="-right-20 -top-16 hidden lg:block" size={300} />

      <header className="relative flex items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
        <span className="font-mono text-[11px] uppercase tracking-wide text-navy-400">{user.email}</span>
      </header>

      <main className="relative mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold text-navy-800">
            Unlock your report
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-navy-500">
            One step away from the full competitor breakdown for{" "}
            {report.answers.companyName}.
          </p>
        </div>

        <div className="mt-8">
          <CheckoutClient reportId={id} companyName={report.answers.companyName} />
        </div>
      </main>
    </div>
  );
}
