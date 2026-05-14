"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfileAction, type ProfileActionResult } from "@/app/actions/profile";
import { Check, AlertCircle } from "lucide-react";

export function ProfileForm({ children }: { children: React.ReactNode }) {
  const [state, formAction, isPending] = useActionState<ProfileActionResult, FormData>(
    updateProfileAction,
    null
  );
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (state) {
      setShowBanner(true);
      if (state.success) {
        const timer = setTimeout(() => setShowBanner(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-8 pb-12">
      {showBanner && state && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border transition-all animate-in fade-in slide-in-from-top-2 duration-300 ${
            state.success
              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/15"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {state.success ? (
            <Check className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {state.message}
        </div>
      )}

      {children}

      <div className="flex justify-start pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none bg-foreground text-background hover:bg-foreground/90 px-8 h-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
