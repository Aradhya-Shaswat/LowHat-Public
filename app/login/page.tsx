"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { authClient } from "@/lib/auth";

const ERROR_MAP: Record<string, string> = {
  "email not verified": "Your email address hasn't been verified yet.",
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

export default function LoginPage() {
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });

    if (signInError) {
      const msg = signInError.message || "";

      // Detect unverified email and redirect to in-app verification
      if (msg.toLowerCase().includes("email not verified") || msg.toLowerCase().includes("email is not verified")) {
        window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
        return;
      }

      setError(normalizeError(msg));
      setIsPending(false);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-12">
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
                <Link href="/login/reset" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password?
                </Link>
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