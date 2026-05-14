"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<"idle" | "verifying" | "verified" | "error">("idle");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (digit && index === 5) {
      const fullCode = newDigits.join("");
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setDigits(newDigits);

      // Focus last filled input or submit
      const lastIndex = Math.min(pasted.length, 6) - 1;
      inputRefs.current[lastIndex]?.focus();

      if (pasted.length === 6) {
        handleVerify(pasted);
      }
    }
  };

  const handleVerify = async (code: string) => {
    setStatus("verifying");
    setError("");

    try {
      const res = await authClient.emailOtp.verifyEmail({
        email,
        otp: code,
      });

      if (res.error) {
        setError("Invalid or expired code. Please try again.");
        setStatus("error");
        // Reset digits and refocus
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        setStatus("verified");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (err: any) {
      setError("Verification failed. Please request a new code.");
      setStatus("error");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResent(false);
    setError("");

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      setResent(true);
      setDigits(["", "", "", "", "", ""]);
      setStatus("idle");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError("Could not resend the verification code.");
    } finally {
      setResending(false);
    }
  };

  const handleManualSubmit = () => {
    const code = digits.join("");
    if (code.length === 6) {
      handleVerify(code);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-10">

        {/* Verifying spinner */}
        {status === "verifying" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            </div>
            <h1 className="text-2xl font-serif tracking-tight">Verifying</h1>
            <p className="text-muted-foreground text-sm">Confirming your identity.</p>
          </div>
        )}

        {/* Verified */}
        {status === "verified" && (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-serif tracking-tight">Email verified</h1>
            <p className="text-muted-foreground text-sm">Your identity has been confirmed. Redirecting to sign in.</p>
          </div>
        )}

        {/* Idle / Error — show the code input */}
        {(status === "idle" || status === "error") && (
          <div className="space-y-8">
            <div className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center">
                <svg className="w-6 h-6 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
                </svg>
              </div>
              <h1 className="text-2xl font-serif tracking-tight">Enter verification code</h1>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
                We sent a 6-digit code to{" "}
                {email ? (
                  <span className="text-foreground font-medium">{email}</span>
                ) : (
                  "your email address"
                )}
              </p>
            </div>

            {/* 6-digit OTP input */}
            <div className="flex justify-center gap-2.5">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-xl font-medium bg-transparent border border-border rounded-lg outline-none focus:border-foreground focus:ring-1 focus:ring-foreground/20 transition-all"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handleManualSubmit}
                disabled={digits.join("").length !== 6}
                className="w-full bg-foreground text-background hover:bg-foreground/90 h-auto py-2.5 text-sm font-medium"
              >
                Verify
              </Button>

              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <span>Didn't receive a code?</span>
                <button
                  onClick={handleResend}
                  disabled={resending || !email}
                  className="text-foreground hover:underline underline-offset-4 disabled:opacity-50 font-medium"
                >
                  {resending ? "Sending..." : "Resend"}
                </button>
              </div>

              {resent && (
                <p className="text-xs text-center text-muted-foreground">
                  A new code has been sent. Check your spam folder if needed.
                </p>
              )}
            </div>

            <div className="text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ← Back to sign in
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
