"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useActionState, useState } from "react";
import { submitBidAction } from "@/app/actions/jobs";

export default function ClientJobView({ job, jobId }: { job: any, jobId: string }) {
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [proposal, setProposal] = useState("");
  const [state, formAction, isPending] = useActionState(submitBidAction, undefined);

  const simulateAIDraft = async () => {
    setIsAIGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setProposal("Based on our extensive experience building scalable backends with Go and Postgres, Team Sigma is uniquely positioned to execute this project. Our lead architect will design the schema in week 1, followed by implementation and load testing to guarantee 10k req/sec throughput. We are ready to begin immediately.");
    setIsAIGenerating(false);
  };

  return (
    <div className="flex flex-col py-12 px-8 max-w-4xl min-h-full">
      <div className="mb-10 border-b border-border pb-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Execution Board
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider font-sans text-primary">
            {job.status}
          </span>
          <span className="text-xs text-muted-foreground font-sans tracking-tight">
            Budget: ${(job.budgetMin / 100).toLocaleString()} - ${(job.budgetMax / 100).toLocaleString()}
          </span>
        </div>
        <h1 className="text-3xl font-heading text-foreground mb-4">{job.title}</h1>
        <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
          {job.description}
        </p>
      </div>

      <div className="bg-card border border-border p-8 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif text-foreground">Submit Execution Bid</h2>
          <button 
            type="button" 
            onClick={simulateAIDraft}
            disabled={isAIGenerating}
            className="text-xs text-secondary-foreground bg-secondary/60 hover:bg-secondary/80 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAIGenerating ? "Drafting..." : "AI Generate Draft"}
          </button>
        </div>

        <form action={formAction} className="space-y-6">
           <input type="hidden" name="jobId" value={jobId} />
           <div className="space-y-3">
             <label className="text-sm font-medium text-foreground">Proposed Implementation Plan</label>
             <textarea 
                name="proposal"
                rows={6}
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors resize-y leading-relaxed" 
                placeholder="Detail your unit's execution strategy..." 
                required
              />
           </div>

           <div className="space-y-3 max-w-xs">
             <label className="text-sm font-medium text-foreground">Total Bid Amount (USD)</label>
             <input name="amount" type="number" placeholder="10000" className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors" required />
           </div>

           {state?.error && (
             <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
               {state.error}
             </div>
           )}

           <div className="pt-4 border-t border-border flex justify-end">
              <Button type="submit" disabled={isPending} className="bg-foreground text-background hover:bg-foreground/90 px-8 py-2 h-auto">
                {isPending ? "Submitting..." : "Submit Bid"}
              </Button>
           </div>
        </form>
      </div>
    </div>
  );
}
