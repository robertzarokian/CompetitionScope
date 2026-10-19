import { AuthForm } from "@/components/auth/AuthForm";

// Only same-site paths are accepted, so a crafted link cannot send someone to
// another website right after they log in.
function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/dashboard";
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/dashboard";
}

export default async function AuthPage({ searchParams }: PageProps<"/auth">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);

  return (
    <AuthForm
      next={next}
      heading="Create your account to continue"
      subheading="An account keeps your reports, tracking history, and alerts saved. It is free to create."
    />
  );
}
