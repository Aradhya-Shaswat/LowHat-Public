"use client";

import { useActionState, useEffect, useState } from "react";
import { updateTeamAction, type TeamActionResult } from "@/app/actions/team";
import { Check, AlertCircle, Pencil } from "lucide-react";

interface TeamEditFormProps {
  teamId: string;
  currentName: string;
  currentDescription: string | null;
}

export function TeamEditForm({ teamId, currentName, currentDescription }: TeamEditFormProps) {
  const [state, formAction, isPending] = useActionState<TeamActionResult, FormData>(
    updateTeamAction,
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (state) {
      setShowBanner(true);
      if (state.success) {
        setIsEditing(false);
        const timer = setTimeout(() => setShowBanner(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [state]);

  if (!isEditing) {
    return (
      <div className="py-8 border-b border-border">
        {showBanner && state?.success && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border mb-6 bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/15 animate-in fade-in slide-in-from-top-2 duration-300">
            <Check className="h-4 w-4 flex-shrink-0" />
            {state.message}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-2xl font-serif text-foreground">{currentName}</h2>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsEditing(true)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary/50"
                title="Edit unit details"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <span className="bg-primary/10 text-primary text-xs px-3 py-1 font-semibold uppercase tracking-widest rounded-full border border-primary/20">
                Verified
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{currentDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="py-8 border-b border-border relative">
      <input type="hidden" name="teamId" value={teamId} />

      {showBanner && state && !state.success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium border mb-6 bg-destructive/10 text-destructive border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {state.message}
        </div>
      )}

      <h3 className="text-lg font-serif text-foreground mb-6">Edit Unit Details</h3>

      <div className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <label className="mb-3 block  text-xs font-medium text-foreground uppercase tracking-wider">Unit Name</label>
          <input
            name="name"
            type="text"
            defaultValue={currentName}
            required
            className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="mb-3 block  text-xs font-medium text-foreground uppercase tracking-wider">Description</label>
          <textarea
            name="description"
            defaultValue={currentDescription || ""}
            placeholder="Describe your capabilities..."
            className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 h-24 resize-y transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-all outline-none select-none bg-foreground text-background hover:bg-foreground/90 px-6 h-8 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => { setIsEditing(false); setShowBanner(false); }}
            className="inline-flex items-center justify-center rounded-lg font-medium transition-all outline-none select-none border border-border hover:bg-secondary/50 px-6 h-8 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
