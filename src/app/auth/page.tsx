import { AuthForm } from "@/components/auth/AuthForm";

export default async function AuthPage({ searchParams }: PageProps<"/auth">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";

  return (
    <AuthForm
      next={next}
      heading="Create your account to continue"
      subheading="You'll need an account to unlock and pay for your report."
    />
  );
}
