"use client";

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth";
import { initProfileAction } from "@/app/actions/auth";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const intent = searchParams.get("intent") as any;
  const name = searchParams.get("name");
  const userId = searchParams.get("id");

  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.replace("/signup");
    }
  }, [email, router]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (otpCode: string) => {
    if (!email || isVerifying) return;
    setIsVerifying(true);
    setError("");

    try {
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email,
        otp: otpCode,
      });

      if (verifyError) {
        setError(verifyError.message || "Invalid verification code");
        setIsVerifying(false);
        setCode(Array(6).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      if (userId && intent && name) {
        const res = await initProfileAction(userId, intent, email, name);
        if (res?.error) {
          console.error(res.error);
        }
        router.replace("/login?verified=true");
      } else {
        router.replace("/login?verified=true");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsVerifying(false);
    }
  };

  const handleInput = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    
    const newCode = [...code];
    newCode[index] = val.slice(-1);
    setCode(newCode);

    if (val && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = newCode.join("");
    if (fullCode.length === 6) {
      handleVerify(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!code[index] && index > 0) {
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...code];
        newCode[index] = "";
        setCode(newCode);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);

    const nextIndex = Math.min(pastedData.length, 5);
    setActiveIndex(nextIndex);
    inputRefs.current[nextIndex]?.focus();

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setError("");
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification"
      });
      setCooldown(60);
      setCode(Array(6).fill(""));
      setActiveIndex(0);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background selection:bg-foreground/10">
      <div className="w-full max-w-md space-y-10 relative z-10">
        
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-foreground/5 mb-4 shadow-[0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-foreground/80">
              <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z" />
              <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif tracking-tight text-foreground">Verify your email</h1>
          <p className="text-sm text-muted-foreground/80 tracking-wide font-medium">
            We sent a secure code to <span className="text-foreground font-semibold">{email}</span>
          </p>
        </div>

        <div className="space-y-8 p-8 rounded-2xl bg-card border border-border/50 shadow-sm backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-background/0 via-foreground/[0.02] to-background/0 pointer-events-none" />

          <div className="flex justify-center items-center gap-3 relative z-10">
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={idx === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                onFocus={() => setActiveIndex(idx)}
                disabled={isVerifying}
                className={`
                  w-12 h-14 text-center text-xl font-medium rounded-xl 
                  bg-background/50 border transition-all duration-200 outline-none
                  ${error ? 'border-destructive/50 text-destructive focus:border-destructive focus:ring-1 focus:ring-destructive/20' : ''}
                  ${!error && activeIndex === idx ? 'border-foreground/30 ring-4 ring-foreground/5 shadow-sm' : ''}
                  ${!error && activeIndex !== idx && digit ? 'border-foreground/20' : ''}
                  ${!error && activeIndex !== idx && !digit ? 'border-border/60' : ''}
                  ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              />
            ))}
          </div>

          <div className="min-h-6 text-center">
            {error ? (
              <p className="text-sm text-destructive font-medium animate-in fade-in slide-in-from-bottom-1">{error}</p>
            ) : isVerifying ? (
              <p className="text-sm text-muted-foreground font-medium animate-pulse flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying code...
              </p>
            ) : null}
          </div>

          <div className="text-center pt-2 relative z-10">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isVerifying}
              className={`text-sm font-medium transition-colors ${
                cooldown > 0 
                  ? "text-muted-foreground cursor-not-allowed" 
                  : "text-foreground hover:text-foreground/70"
              }`}
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive a code? Resend"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <VerifyContent />
    </Suspense>
  );
}
