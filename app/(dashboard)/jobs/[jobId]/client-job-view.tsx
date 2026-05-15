"use client";

import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useActionState, useState } from "react";
import { submitBidAction } from "@/app/actions/jobs";

export default function ClientJobView({
  job,
  jobId,
  role,
  clientName,
}: {
  job: any;
  jobId: string;
  role: string;
  clientName: string;
}) {
  const [proposal, setProposal] = useState("");
  const [state, formAction, isPending] = useActionState(submitBidAction, undefined);

  return (
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full">
      <div className="mb-10 border-b border-border pb-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> {role === "client" ? "Back to Marketplace" : "Back to Execution Board"}
        </Link>
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider font-sans text-primary block mb-2">
              {job.status}
            </span>
            {job.moderationStatus !== "approved" && (
              <div className={`text-[10px] font-bold uppercase tracking-tight px-3 py-1 rounded border mb-4 inline-flex items-center gap-2 ${
                job.moderationStatus === "pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : 
                job.moderationStatus === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" :
                "bg-muted text-muted-foreground border-border"
              }`}>
                <AlertCircle className="w-3 h-3" />
                {job.moderationStatus === "pending" ? "Awaiting Admin Approval" : `Moderation: ${job.moderationStatus}`}
              </div>
            )}
            <h1 className="text-3xl font-heading text-foreground mb-4">{job.title}</h1>
          </div>
          <div className="text-right pt-1">
            <span className="text-sm font-medium text-foreground font-sans tracking-tight">
              ${(job.budgetMin / 100).toLocaleString()} – ${(job.budgetMax / 100).toLocaleString()}
            </span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
          {job.description}
        </p>
        <div className="mt-6">
          <span className="text-sm font-medium text-foreground">{clientName}</span>
        </div>
      </div>

      {role === "freelancer" ? (
        <div className="bg-card border border-border p-8 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif text-foreground">Submit Execution Bid</h2>
          </div>

          <form action={formAction} className="space-y-6">
             <input type="hidden" name="jobId" value={jobId} />
             <div className="space-y-3">
               <label className="mb-3 block text-sm font-medium text-foreground">Proposed Implementation Plan</label>
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
               <label className="mb-3 block text-sm font-medium text-foreground">Total Bid Amount (USD)</label>
               <input name="amount" type="number" placeholder="10000" className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors" required />
             </div>

             {state?.error && (
               <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                 {state.error}
               </div>
             )}

             <div className="pt-4 border-t border-border flex justify-end">
                <button type="submit" disabled={isPending} className="inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-all outline-none select-none bg-foreground text-background hover:bg-foreground/90 px-8 py-2 h-auto text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {isPending ? "Submitting..." : "Submit Bid"}
                </button>
             </div>
          </form>
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card/30">
          <p className="text-sm text-muted-foreground">Only execution units (freelancers) can submit bids on contracts.</p>
        </div>
      )}
    </div>
  );
}
