import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { AdminLogin } from "@/components/admin/AdminClient";
import { getAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="paper-panel w-full max-w-sm border border-navy-600 p-7">
        <Logo />
        <h1 className="mt-6 font-display text-2xl font-semibold text-navy-800">Admin sign in</h1>
        <p className="mb-5 mt-1 text-sm text-navy-500">For site administrators only.</p>
        <AdminLogin />
      </div>
    </div>
  );
}
