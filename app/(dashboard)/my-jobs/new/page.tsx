"use client";

import { useActionState, useState } from "react";
import { createJobAction } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function NewJobPage() {
  const [state, formAction, isPending] = useActionState(createJobAction, undefined);
  const [description, setDescription] = useState("");
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);

  const simulateAIAssist = async () => {
    setIsAIAnalyzing(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 1200));
    setDescription((prev) => 
      prev + "\n\n---\nAI Suggested Requirements:\n- Must demonstrate capability to deploy on scalable edge infrastructure.\n- Timeline: Expecting delivery in 4-6 weeks.\n- Communication: Weekly syncs required."
    );
    setIsAIAnalyzing(false);
  };

  return (
    <div className="flex flex-col py-12 px-8 max-w-3xl mx-auto min-h-full">
      <div className="mb-8">
        <Link href="/my-jobs" className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to postings
        </Link>
        <h1 className="text-3xl font-heading text-foreground mb-2">Draft Execution Contract</h1>
        <p className="text-muted-foreground text-sm">Draft a clear and bounded job so exactly the right micro-agency can bid.</p>
      </div>

      <form action={formAction} className="space-y-8 bg-card border border-border p-8 rounded-xl">
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Project Title</label>
          <input
            name="title"
            type="text"
            placeholder="e.g. Scalable Auth Architecture Implementation"
            className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
            required
          />
        </div>

        <div className="space-y-3 relative">
          <div className="flex justify-between items-end">
            <label className="text-sm font-medium text-foreground">Detailed Description & Bounds</label>
            <button 
              type="button" 
              onClick={simulateAIAssist}
              disabled={isAIAnalyzing || description.length < 10}
              className="text-xs text-secondary-foreground bg-secondary/60 hover:bg-secondary/80 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAIAnalyzing ? "Scoping..." : "AI Scope Assist"}
            </button>
          </div>
          <textarea
            name="description"
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the end state, technical requirements, and acceptance criteria..."
            className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors resize-y leading-relaxed"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Minimum Budget (USD)</label>
            <input
              name="budgetMin"
              type="number"
              min="100"
              placeholder="5000"
              className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
              required
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Maximum Budget (USD)</label>
            <input
              name="budgetMax"
              type="number"
              min="100"
              placeholder="15000"
              className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
              required
            />
          </div>
        </div>

        {state?.error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {state.error}
          </div>
        )}

        <div className="pt-4 border-t border-border flex justify-end">
          <Button type="submit" disabled={isPending} className="bg-foreground text-background hover:bg-foreground/90 px-8 py-2 h-auto">
            {isPending ? "Posting..." : "Post to Marketplace"}
          </Button>
        </div>
      </form>
    </div>
  );
}
