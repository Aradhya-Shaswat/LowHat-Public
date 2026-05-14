"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { authClient } from "@/lib/auth";

const ERROR_MAP: Record<string, string> = {
  "invalid credentials": "The email or password you entered is incorrect.",
  "invalid email or password": "The email or password you entered is incorrect.",
  "user not found": "No account exists with this email address.",
  "too many requests": "Too many sign-in attempts. Please wait a moment and try again.",
};

function normalizeError(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key)) return friendly;
  }
  return "Unable to sign in. Please check your credentials and try again.";
}

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const isVerified = searchParams.get("verified") === "true";

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        const errStr = JSON.stringify(signInError);
        console.error("SignIn Error (raw):", errStr);

        const isUnverified =
          signInError.status === 403 ||
          signInError.code === "EMAIL_NOT_VERIFIED" ||
          signInError.code === "FORBIDDEN" ||
          errStr.includes("403") ||
          errStr.toLowerCase().includes("email is not verified") ||
          errStr.toLowerCase().includes("forbidden");

        if (isUnverified) {
          router.push(`/verify?email=${encodeURIComponent(email)}`);
          return;
        }

        setError(normalizeError(signInError.message || "") + " (Raw: " + errStr + ")");
        setIsPending(false);
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setError(normalizeError(err.message || ""));
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background selection:bg-foreground/10">
      <div className="w-full max-w-md space-y-10 relative z-10">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-serif tracking-tight">Sign in to LowHat</h1>
          <p className="text-muted-foreground">Continue to your execution workspace.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {isVerified && !error && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20">
              Your email has been verified. You can now sign in.
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full bg-foreground text-background hover:bg-foreground/90 py-2 h-auto text-sm font-medium">
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-foreground hover:underline underline-offset-4">
            Apply for access
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}