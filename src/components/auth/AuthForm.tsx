"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Lock, Mail } from "lucide-react";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { LogoWatermark } from "@/components/decor/LogoWatermark";

interface AuthFormProps {
  next: string;
  skippable?: boolean;
  heading?: string;
  subheading?: string;
}

type Mode = "signup" | "login";

export function AuthForm({
  next,
  skippable = false,
  heading = "Create your account",
  subheading = "Save your progress and unlock your report when it's ready.",
}: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode === "signup" ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <LogoWatermark className="-right-24 -top-24 hidden lg:block" size={300} />
      <LogoWatermark className="-bottom-28 -left-20 hidden lg:block" size={260} />
      {skippable && (
        <button
          onClick={() => router.push(next)}
          aria-label="Skip for now"
          className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center border border-navy-300 text-navy-400 transition hover:border-navy-500 hover:text-navy-800 sm:right-10 sm:top-8"
        >
          <X size={18} />
        </button>
      )}

      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo tagline />
        </div>

        <div className="card-glow paper-panel border border-navy-600 p-7">
          <div className="mb-6 flex border border-navy-300 bg-cream-200 p-1">
            {(["signup", "login"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 font-mono text-xs uppercase tracking-wide transition ${
                  mode === m
                    ? "bg-brass-400 text-navy-950"
                    : "text-navy-400 hover:text-navy-800"
                }`}
              >
                {m === "signup" ? "Sign up" : "Log in"}
              </button>
            ))}
          </div>

          <h1 className="font-display text-xl font-semibold text-navy-800">
            {mode === "signup" ? heading : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-navy-500">
            {mode === "signup" ? subheading : "Log in to continue."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-sm border border-navy-300 bg-cream-50 py-3 pl-11 pr-4 text-sm text-navy-800 placeholder:text-navy-300 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-400/20"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="Password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-sm border border-navy-300 bg-cream-50 py-3 pl-11 pr-4 text-sm text-navy-800 placeholder:text-navy-300 outline-none transition focus:border-brass-500 focus:ring-2 focus:ring-brass-400/20"
              />
            </div>

            {error && (
              <p className="border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full" size="md">
              {loading
                ? "One moment..."
                : mode === "signup"
                  ? "Create account"
                  : "Log in"}
            </Button>
          </form>
        </div>

        {skippable && (
          <p className="mt-5 text-center font-mono text-[11px] uppercase tracking-wide text-navy-400">
            You can also{" "}
            <button
              onClick={() => router.push(next)}
              className="text-brass-600 underline underline-offset-2 hover:text-brass-700"
            >
              skip for now
            </button>{" "}
            and create an account later.
          </p>
        )}
      </div>
    </div>
  );
}
