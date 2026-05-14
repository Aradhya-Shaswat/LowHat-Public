"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { authClient } from "@/lib/auth";
import { initProfileAction } from "@/app/actions/auth";

const ERROR_MAP: Record<string, string> = {
  "user already exists": "An account with this email already exists.",
  "password is too short": "Password must be at least 8 characters.",
  "invalid email": "Please enter a valid email address.",
  "too many requests": "Too many attempts. Please wait a moment.",
};

function normalizeError(raw: string): string {
  const lower = raw.toLowerCase();
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key)) return friendly;
  }
  return "Unable to create your account. Please try again.";
}

export default function SignupPage() {
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const intent = formData.get("intent") as "client" | "freelancer" | "admin";

    const { data, error: signUpError } = await authClient.signUp.email({
      email,
      password,
      name: `${firstName} ${lastName}`,
    });

    if (signUpError) {
      setError(normalizeError(signUpError.message || ""));
      setIsPending(false);
    } else if (data?.user?.id) {
      // Initialize their role-specific profile
      const res = await initProfileAction(data.user.id, intent);
      if (res?.error) {
        setError("Your account was created, but profile setup encountered an issue. Please sign in to continue.");
        setIsPending(false);
      } else {
        // Redirect to email verification
        window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
      }
    } else {
      // Account created but no user ID returned — still redirect to verify
      window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-12">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-serif tracking-tight">Apply for LowHat</h1>
          <p className="text-muted-foreground">Join the execution network as a client or independent unit.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">First name</label>
                <input
                  name="firstName"
                  type="text"
                  className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Last name</label>
                <input
                  name="lastName"
                  type="text"
                  className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email address</label>
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <input
                name="password"
                type="password"
                minLength={8}
                className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                required
              />
              <p className="text-[11px] text-muted-foreground">Minimum 8 characters</p>
            </div>

            <div className="pt-2">
              <label className="text-sm font-medium text-foreground mb-3 block">I want to join as:</label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-3 border border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="radio" name="intent" value="client" className="accent-foreground" required />
                  <span className="text-sm text-center w-full">Client</span>
                </label>
                <label className="flex items-center gap-2 p-3 border border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="radio" name="intent" value="freelancer" className="accent-foreground" required />
                  <span className="text-sm text-center w-full">Freelancer</span>
                </label>
                <label className="flex items-center gap-2 p-3 border border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="radio" name="intent" value="admin" className="accent-foreground" required />
                  <span className="text-sm text-center w-full">Admin</span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full bg-foreground text-background hover:bg-foreground/90 py-2 h-auto text-sm font-medium">
            {isPending ? "Creating account..." : "Submit Application"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Already a member?{" "}
          <Link href="/login" className="text-foreground hover:underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}