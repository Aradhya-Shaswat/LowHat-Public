"use client";

import { voteRemovalAction } from "@/app/actions/units";
import { Vote, Timer, ShieldAlert, CheckCircle2, XCircle, History } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

interface UnitGovernanceProps {
  activeRemovals: {
    request: { id: string, targetUserId: string, createdAt: Date };
    target: { name: string | null, email: string };
  }[];
  coolingRemovals: {
    request: { id: string, targetUserId: string, coolingEndsAt: Date | null };
    target: { name: string | null, email: string };
  }[];
  unitId: string;
  currentUserId: string;
  currentUserRole: string;
}

export function UnitGovernance({ activeRemovals, coolingRemovals, unitId, currentUserId, currentUserRole }: UnitGovernanceProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function handleVote(id: string, vote: 'approve' | 'reject') {
    const result = await voteRemovalAction(id, vote);
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
      {}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-serif text-foreground">Governance Votes</h3>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-amber-500/10 text-amber-600 rounded">
            Supermajority Required (70%)
          </span>
        </div>

        {activeRemovals.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-border/50 text-center">
            <p className="text-sm text-muted-foreground italic">No active removal votes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeRemovals.map((r) => (
              <div key={r.request.id} className="p-6 rounded-2xl border border-border/50 bg-card shadow-sm space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      Removal Proposal: {r.target.name}
                    </p>
                    <p className="text-xs text-muted-foreground italic">Initiated by Unit Owner</p>
                  </div>
                  {r.request.targetUserId !== currentUserId && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleVote(r.request.id, 'approve')}
                        className="px-4 py-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleVote(r.request.id, 'reject')}
                        className="px-4 py-2 border border-rose-500/20 bg-rose-500/5 text-rose-600 hover:bg-rose-500/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Vote Progress</span>
                    <span>70% Required</span>
                  </div>
                  <Progress value={40} className="h-2 bg-foreground/5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {}
      <section className="space-y-6 pt-12 border-t border-border/30">
        <h3 className="text-xl font-serif text-foreground">Active Offboarding (Cooling)</h3>
        
        {coolingRemovals.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-border/50 text-center">
            <p className="text-sm text-muted-foreground italic">No members currently in cooling period.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {coolingRemovals.map((r) => (
              <div key={r.request.id} className="p-6 rounded-2xl border border-border/50 bg-secondary/5 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      Cooling Period: {r.target.name}
                    </p>
                    <p className="text-xs text-muted-foreground">Limited access to isolated handover workspace.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Time Remaining</p>
                    <p className="text-sm font-mono font-bold text-foreground tabular-nums">
                      {getRemainingTime(r.request.coolingEndsAt)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Governance Approved
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <Timer className="h-3.5 w-3.5 text-amber-600" />
                    Pending Asset Transfer
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
