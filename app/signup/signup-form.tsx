"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { validateProfanity } from "@/lib/profanity";

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

export default function SignupForm() {
  const router = useRouter();
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
    const fullName = `${firstName} ${lastName}`;

    const profanityError = validateProfanity(firstName, "first name") || validateProfanity(lastName, "last name");
    if (profanityError) {
      setError(profanityError);
      setIsPending(false);
      return;
    }

    try {
      const { data, error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name: fullName,
      });

      if (signUpError) {
        console.error("SignUp Error from auth service:", signUpError);
        setError(normalizeError(signUpError.message || "") + " (Detail: " + signUpError.message + ")");
        setIsPending(false);
      } else if (data?.user?.id) {
        router.push(`/verify?email=${encodeURIComponent(email)}&intent=${intent}&name=${encodeURIComponent(fullName)}&id=${data.user.id}`);
      } else {
        router.push("/");
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
          <h1 className="text-3xl font-serif tracking-tight"><span className="font-jersey">LowHat</span></h1>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground">First name</label>
                <input
                  name="firstName"
                  type="text"
                  placeholder="Jane"
                  className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="mb-3 block text-sm font-medium text-foreground">Last name</label>
                <input
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">Email address</label>
              <input
                name="email"
                type="email"
                placeholder="name@example.com"
                className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                required
              />
            </div>
            <div>
              <label className="mb-3 block text-sm font-medium text-foreground">Password</label>
              <input
                name="password"
                type="password"
                minLength={8}
                className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                required
              />
            </div>

            <div className="pt-2">
              <label className="mb-3 block text-sm font-medium text-foreground">I want to join as:</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="mb-3 block flex items-center gap-2 p-3 border border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="radio" name="intent" value="client" className="accent-foreground" required />
                  <span className="text-sm text-center w-full">Client</span>
                </label>
                <label className="mb-3 block  flex items-center gap-2 p-3 border border-border rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="radio" name="intent" value="freelancer" className="accent-foreground" required />
                  <span className="text-sm text-center w-full">Freelancer</span>
                </label>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-2.5 bg-foreground text-background hover:bg-foreground/90 py-2.5 rounded-md text-sm font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed select-none"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account...
              </>
            ) : "Submit Application"}
          </button>
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
