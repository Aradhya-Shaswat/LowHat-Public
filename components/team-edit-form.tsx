"use client";

import { useActionState, useEffect, useState } from "react";
import { updateUnitAction as updateTeamAction, type UnitActionResult as TeamActionResult } from "@/app/actions/units";
import { Check, AlertCircle, Pencil, HelpCircle, X, Save } from "lucide-react";

interface TeamEditFormProps {
  teamId: string;
  currentName: string;
  currentDescription: string | null;
  moderationStatus: "pending" | "approved" | "rejected" | "suspended";
  onSuccess?: () => void;
}

export function TeamEditForm({ teamId, currentName, currentDescription, moderationStatus, onSuccess }: TeamEditFormProps) {
  const [state, formAction, isPending] = useActionState<TeamActionResult, FormData>(
    updateTeamAction,
    null
  );
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (state) {
      setShowBanner(true);
      if (state.success) {
        const timer = setTimeout(() => {
          setShowBanner(false);
          onSuccess?.();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [state, onSuccess]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <form action={formAction} className="p-8 rounded-3xl border border-border bg-card shadow-2xl space-y-8">
        <input type="hidden" name="teamId" value={teamId} />
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-serif text-foreground">Redefine Unit Identity</h3>
            <p className="text-xs text-muted-foreground">Ensure your name and mandate reflect your current operational focus.</p>
          </div>
        </div>

        {showBanner && state && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium border animate-in slide-in-from-top-2 duration-300 ${
            state.success 
              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400" 
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}>
            {state.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {state.message}
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-foreground uppercase tracking-wider ml-1">Unit Name</label>
            <input
              name="name"
              type="text"
              defaultValue={currentName}
              required
              className="w-full px-4 py-3 bg-foreground/[0.02] border border-border rounded-2xl text-sm outline-none focus:border-foreground/20 focus:bg-transparent transition-all placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-foreground uppercase tracking-wider ml-1">Operational Mandate</label>
            <textarea
              name="description"
              defaultValue={currentDescription || ""}
              placeholder="Describe your collective's unique edge and mission..."
              className="w-full px-4 py-3 bg-foreground/[0.02] border border-border rounded-2xl text-sm outline-none focus:border-foreground/20 focus:bg-transparent h-32 resize-none transition-all placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 px-8 py-3 rounded-2xl bg-foreground text-background text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl shadow-foreground/10"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPending ? "Persisting..." : "Save Identity"}
          </button>
          <button
            type="button"
            onClick={() => onSuccess?.()}
            className="px-8 py-3 rounded-2xl border border-border hover:bg-foreground/5 text-xs font-bold uppercase tracking-wider transition-all"
          >
            Discard
          </button>
        </div>
      </form>
    </div>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
