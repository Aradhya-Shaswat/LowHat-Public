"use client";

import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useActionState, useState } from "react";
import { submitBidAction, generateBidAIAssistAction } from "@/app/actions/jobs";
import { Button } from "@/components/ui/button";

export default function ClientJobView({
  job,
  jobId,
  role,
  clientName,
  teamMembers = [],
  hasBidded = false,
}: {
  job: any;
  jobId: string;
  role: string;
  clientName: string;
  teamMembers?: { id: string; name: string }[];
  hasBidded?: boolean;
}) {
  const [proposal, setProposal] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [assignments, setAssignments] = useState<{ task: string; memberId: string }[]>([]);
  const [state, formAction, isPending] = useActionState(submitBidAction, undefined);
  const [isAiPending, setIsAiPending] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleAiGenerate = async () => {
    setIsAiPending(true);
    setAiError("");
    
    const result = await generateBidAIAssistAction(job.title, job.description);
    
    setIsAiPending(false);
    
    if (result.error) {
      setAiError(result.error);
      return;
    }
    
    if (result.proposal) {
      setProposal(result.proposal);
    }
    if (result.estimatedDelivery) {
      setEstimatedDelivery(result.estimatedDelivery);
    }
  };

  const addAssignment = () => {
    setAssignments([...assignments, { task: "", memberId: "" }]);
  };

  const updateAssignment = (index: number, field: "task" | "memberId", value: string) => {
    const updated = [...assignments];
    if (field === "memberId") {
      const member = teamMembers.find(m => m.id === value);
      updated[index]["memberId"] = value;
      (updated[index] as any)["memberName"] = member?.name || "Unknown";
    } else {
      updated[index][field] = value;
    }
    setAssignments(updated);
  };

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

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
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-border pt-6 max-w-3xl">
          {job.workCategory && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Category</span>
              <span className="text-sm text-foreground">{job.workCategory}</span>
            </div>
          )}
          {job.experienceLevel && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Experience</span>
              <span className="text-sm text-foreground">{job.experienceLevel}</span>
            </div>
          )}
          {job.timeAllowed && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Timeline</span>
              <span className="text-sm text-foreground">{job.timeAllowed}</span>
            </div>
          )}
          {job.requiredSkills && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Skills</span>
              <span className="text-sm text-foreground">{job.requiredSkills}</span>
            </div>
          )}
        </div>
        <div className="mt-6">
          <span className="text-sm font-medium text-foreground">{clientName}</span>
        </div>
      </div>

      {role === "freelancer" ? (
        hasBidded ? (
          <div className="mt-12 border-t border-border pt-10 text-center">
            <div className="py-12 border border-dashed border-border rounded-xl bg-card/30">
              <p className="text-sm text-muted-foreground">Your unit has already submitted a bid for this contract.</p>
            </div>
          </div>
        ) : (
          <div className="mt-12 border-t border-border pt-10">
          <div className="mb-8">
            <h2 className="text-2xl font-serif text-foreground mb-2">Submit Execution Bid</h2>
            <p className="text-muted-foreground text-sm">Propose your terms and timeline for this execution contract.</p>
          </div>

          <form action={formAction} className="space-y-8">
             <input type="hidden" name="jobId" value={jobId} />
             <input type="hidden" name="taskAssignments" value={JSON.stringify(assignments)} />
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
               {/* Left Column - Main Form */}
               <div className="lg:col-span-2 space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-foreground">Proposed Implementation Plan</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAiGenerate}
                        disabled={isAiPending}
                        className="text-xs h-8 gap-1.5"
                      >
                        {isAiPending ? "Generating..." : "Fill with AI"}
                      </Button>
                    </div>
                    <textarea 
                       name="proposal"
                       rows={8}
                       value={proposal}
                       onChange={(e) => setProposal(e.target.value)}
                       className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors resize-y leading-relaxed" 
                       placeholder="Detail your unit's execution strategy, acceptance criteria handling, and deliverables..." 
                       required
                     />
                     {aiError && (
                       <p className="text-xs text-destructive mt-1">{aiError}</p>
                     )}
                  </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <label className="block mb-3 text-sm font-medium text-foreground">Total Bid Amount (USD)</label>
                     <input 
                       name="amount" 
                       type="number" 
                       placeholder="10000" 
                       className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors" 
                       required 
                     />
                   </div>

                    <div className="space-y-3">
                      <label className="block mb-3 text-sm font-medium text-foreground">Estimated Delivery Time</label>
                      <input 
                        name="estimatedDelivery" 
                        type="text" 
                        value={estimatedDelivery}
                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                        placeholder="e.g. 2 weeks, 1 month" 
                        className="w-full px-4 py-3 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors" 
                        required 
                      />
                    </div>
                 </div>
               </div>

               {/* Right Column - Team Assignments */}
               <div className="space-y-6">
                 <div>
                   <h3 className="text-lg font-serif text-foreground mb-1">Team Assignments</h3>
                   <p className="text-muted-foreground text-xs">Assign members to specific tasks. This will be visible to the client.</p>
                 </div>
                 
                 <div className="space-y-4">
                   {assignments.map((assignment, index) => (
                     <div key={index} className="space-y-2 p-4 border border-border rounded-md relative">
                       <button 
                         type="button" 
                         onClick={() => removeAssignment(index)}
                         className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-xs"
                       >
                         Remove
                       </button>
                       <div className="space-y-1">
                         <label className="text-xs font-medium text-foreground">Task</label>
                         <input 
                           type="text" 
                           value={assignment.task}
                           onChange={(e) => updateAssignment(index, "task", e.target.value)}
                           placeholder="e.g. Frontend Dev, Quality Assurance"
                           className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                           required
                         />
                       </div>
                       <div className="space-y-1">
                         <label className="text-xs font-medium text-foreground">Assignee</label>
                         <select
                           value={assignment.memberId}
                           onChange={(e) => updateAssignment(index, "memberId", e.target.value)}
                           className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 transition-colors"
                           required
                         >
                           <option value="">Select member...</option>
                           {teamMembers.map(m => (
                             <option key={m.id} value={m.id}>{m.name}</option>
                           ))}
                         </select>
                       </div>
                     </div>
                   ))}
                   
                   <Button 
                     type="button" 
                     variant="outline" 
                     size="sm" 
                     onClick={addAssignment}
                     className="w-full text-xs h-9"
                   >
                     Add Assignment
                   </Button>
                 </div>
               </div>
             </div>

             {state?.error && (
               <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                 {state.error}
               </div>
             )}

             <div className="pt-6 border-t border-border flex justify-end">
                <button type="submit" disabled={isPending} className="inline-flex shrink-0 items-center justify-center rounded-sm font-bold uppercase tracking-widest transition-all outline-none select-none bg-foreground text-background hover:bg-foreground/90 px-10 py-4 h-auto text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                  {isPending ? "Submitting..." : "Submit Bid"}
                </button>
             </div>
          </form>
        </div>
        )
      ) : (
        <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card/30">
          <p className="text-sm text-muted-foreground">Only execution units (freelancers) can submit bids on contracts.</p>
        </div>
      )}
    </div>
  );
}
