"use client";

import { useState } from "react";
import { DetailModal } from "./detail-modal";
import { HelpCircle, Clock, DollarSign, User, ShieldCheck } from "lucide-react";

interface ModerationCardProps {
  type: "job" | "unit" | "identity";
  data: any;
  client?: any;
  action: any;
}

export function ModerationCard({ type, data, client, action }: ModerationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [moderationState, setModerationState] = useState<"idle" | "rejecting">("idle");

  const title = type === "job" ? data.title : type === "unit" ? data.name : "Identity Verification";
  const subtitle = type === "job" ? `Contract Submission • ${client?.name || "Unknown"}` : 
                  type === "unit" ? "Unit Verification Request" : 
                  `Identity Verification • ${data.targetType}`;

  const resetState = () => {
    setIsModalOpen(false);
    setModerationState("idle");
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="group py-10 border-b border-border/60 hover:border-foreground/40 transition-all cursor-pointer last:border-0 first:pt-0"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1.5 flex-1 pr-12">
            <div className="text-[10px] font-bold tracking-tight text-muted-foreground flex items-center gap-2">
              {subtitle}
            </div>
            <h3 className="text-2xl font-serif text-foreground group-hover:text-foreground/80 transition-colors leading-tight">{title}</h3>
          </div>
          <div className="text-right">
            {type === "job" && (
              <div className="text-sm font-medium text-foreground tracking-tight">
                ${(data.budgetMin! / 100).toLocaleString()} – ${(data.budgetMax! / 100).toLocaleString()}
              </div>
            )}
            <div className="text-[10px] font-bold tracking-tight text-muted-foreground mt-1 tabular-nums">
              {new Date(data.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </div>
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl line-clamp-2">
          {data.description || "No detailed description provided."}
        </p>
      </div>

      <DetailModal 
        isOpen={isModalOpen} 
        onClose={resetState} 
        title={title}
      >
        <div className="space-y-12">
          <header className="flex flex-wrap gap-x-12 gap-y-8 items-start justify-center text-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-muted-foreground">State</span>
              <span className="text-xs font-medium text-foreground">Awaiting Review</span>
            </div>
            {type === "job" && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-muted-foreground">Budget Range</span>
                <span className="text-xs font-medium text-foreground">${(data.budgetMin! / 100).toLocaleString()} – ${(data.budgetMax! / 100).toLocaleString()}</span>
              </div>
            )}
            {client && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-muted-foreground">Author</span>
                <span className="text-xs font-medium text-foreground">{client.name}</span>
              </div>
            )}
            {type === "identity" && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-muted-foreground">Entity ID</span>
                <span className="text-xs font-mono text-foreground">{data.targetTeamId || data.targetUserId}</span>
              </div>
            )}
          </header>

          <section className="space-y-4">
            <h4 className="text-[10px] font-bold text-muted-foreground text-center">Description / Record Context</h4>
            <div className="text-sm text-foreground leading-relaxed max-w-4xl mx-auto whitespace-pre-wrap font-sans text-center">
              {data.description || "No context provided."}
            </div>
          </section>

          {type === "job" && (
            <section className="pt-6 border-t border-border/30 text-center max-w-2xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {data.workCategory && (
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block mb-1">Category</span>
                    <span className="text-xs font-medium text-foreground">{data.workCategory}</span>
                  </div>
                )}
                {data.experienceLevel && (
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block mb-1">Experience</span>
                    <span className="text-xs font-medium text-foreground">{data.experienceLevel}</span>
                  </div>
                )}
                {data.timeAllowed && (
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block mb-1">Timeline</span>
                    <span className="text-xs font-medium text-foreground">{data.timeAllowed}</span>
                  </div>
                )}
                {data.requiredSkills && (
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground block mb-1">Skills</span>
                    <span className="text-xs font-medium text-foreground">{data.requiredSkills}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          <section className="pt-12 border-t border-border/50 text-center">
            <h4 className="text-[10px] font-bold text-muted-foreground mb-8">Executive Action</h4>
            
            <form action={action} className="space-y-8 max-w-2xl mx-auto">
              {type === "job" && <input type="hidden" name="jobId" value={data.id} />}
              {type === "unit" && <input type="hidden" name="teamId" value={data.id} />}
              {type === "identity" && <input type="hidden" name="verificationId" value={data.id} />}

              <div className="flex flex-col gap-6 items-center">
                {moderationState === "idle" ? (
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <button 
                      type="submit" 
                      name="status" 
                      value="approved" 
                      className="bg-foreground text-background text-xs font-bold px-10 py-4 rounded-sm hover:opacity-90 transition-all shadow-xl"
                    >
                      Confirm & Publish
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setModerationState("rejecting")}
                      className="text-[10px] font-bold text-muted-foreground hover:text-rose-600 transition-colors px-6"
                    >
                      Reject Submission
                    </button>
                    {type === "unit" && (
                      <button 
                        type="submit" 
                        name="status" 
                        value="suspended" 
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-2 w-full">
                      <textarea 
                        name="reason" 
                        rows={4}
                        autoFocus
                        placeholder="Please provide a specific reason for rejection..." 
                        className="w-full bg-secondary/20 border border-border rounded-sm text-sm p-4 outline-none focus:border-foreground/40 transition-colors font-sans resize-none text-center"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button 
                        type="submit" 
                        name="status" 
                        value="rejected" 
                        className="bg-rose-600 text-white text-xs font-bold px-10 py-4 rounded-sm hover:bg-rose-700 transition-all shadow-xl"
                      >
                        Confirm Rejection
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setModerationState("idle")}
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors px-6"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </section>
        </div>
      </DetailModal>
    </>
  );
}
