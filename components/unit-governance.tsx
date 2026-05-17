"use client";

import { voteRemovalAction, finalizeRemovalAction } from "@/app/actions/units";
import { Vote, Timer, ShieldAlert, CheckCircle2, XCircle, History } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

interface UnitGovernanceProps {
  activeRemovals: {
    request: { id: string, targetUserId: string, createdAt: Date };
    target: { name: string | null, email: string };
    userVote: { vote: 'approve' | 'reject' } | null;
  }[];
  coolingRemovals: {
    request: { id: string, targetUserId: string, coolingEndsAt: Date | null };
    target: { name: string | null, email: string };
  }[];
  unitId: string;
  currentUserId: string;
  currentUserRole: string;
  isCooling: boolean;
}

export function UnitGovernance({ activeRemovals, coolingRemovals, unitId, currentUserId, currentUserRole, isCooling }: UnitGovernanceProps) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleVote(id: string, vote: 'approve' | 'reject') {
    const result = await voteRemovalAction(id, vote);
    if (!result.success) alert(result.message);
  }

  async function handleFinalize(id: string) {
    const result = await finalizeRemovalAction(id);
    if (!result.success) alert(result.message);
  }

  function getRemainingTime(endTime: Date | null) {
    if (!endTime) return "00:00:00";
    const diff = new Date(endTime).getTime() - now.getTime();
    if (diff <= 0) return "00:00:00";
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div className="space-y-12">
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-serif text-foreground">Governance Votes</h3>
          <span className="text-[10px] font-semibold text-amber-600 tracking-widest uppercase font-sans border border-amber-500/20 px-2 py-0.5">
            Supermajority required (70%)
          </span>
        </div>

        {activeRemovals.length === 0 ? (
          <div className="py-12 border-t border-border/30 text-center">
            <p className="text-sm text-muted-foreground font-sans">No active removal votes.</p>
          </div>
        ) : (
          <div className="flex flex-col border-t border-border/30">
            {activeRemovals.map((r) => (
              <div key={r.request.id} className="py-10 border-b border-border/50 space-y-8">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-foreground flex items-center gap-3 font-sans">
                      Removal proposal: {r.target.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans">Initiated by unit owner</p>
                  </div>
                  {r.request.targetUserId !== currentUserId && !r.userVote && !isCooling && (
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => handleVote(r.request.id, 'approve')}
                        className="px-6 py-2 bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all font-sans"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleVote(r.request.id, 'reject')}
                        className="px-6 py-2 border border-border text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all font-sans"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {r.userVote && (
                    <div className="flex items-center gap-2 px-4 py-1.5 border border-border/50 bg-foreground/5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-sans">
                        You voted: {r.userVote.vote}
                      </span>
                    </div>
                  )}
                  {isCooling && !r.userVote && (
                    <div className="flex items-center gap-2 px-4 py-1.5 border border-amber-500/20 bg-amber-500/5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 font-sans">
                        Voting restricted during offboarding
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-w-md">
                  <div className="flex justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-sans">
                    <span>Vote progress</span>
                    <span>70% required</span>
                  </div>
                  <Progress value={40} className="h-1 bg-foreground/5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {}
      <section className="space-y-8 pt-16 border-t border-border/30">
        <h3 className="text-2xl font-serif text-foreground">Active Offboarding (Cooling)</h3>
        
        {coolingRemovals.length === 0 ? (
          <div className="py-12 text-center border-t border-border/30">
            <p className="text-sm text-muted-foreground font-sans">No members currently in cooling period.</p>
          </div>
        ) : (
          <div className="flex flex-col border-t border-border/30">
            {coolingRemovals.map((r) => (
              <div key={r.request.id} className="py-10 border-b border-border/50 space-y-8">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-foreground flex items-center gap-3 font-sans">
                      <Timer className="h-5 w-5 text-muted-foreground/40" />
                      Cooling period: {r.target.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-sans ml-8">Limited access to isolated handover workspace.</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest font-sans">Time remaining</p>
                    <p className="text-xl font-semibold text-foreground font-sans tabular-nums leading-none">
                      {mounted ? getRemainingTime(r.request.coolingEndsAt) : "--:--:--"}
                    </p>
                  </div>
                  {currentUserRole === 'owner' && r.request.coolingEndsAt && now >= new Date(r.request.coolingEndsAt) && (
                    <button 
                      onClick={() => handleFinalize(r.request.id)}
                      className="px-6 py-2 bg-rose-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-all font-sans ml-4"
                    >
                      Finalize Removal
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-8 pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-sans">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600/60" />
                    Governance approved
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-sans">
                    <Timer className="h-3.5 w-3.5 text-amber-600/60" />
                    Pending asset transfer
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
