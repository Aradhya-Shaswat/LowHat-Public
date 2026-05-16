"use client";

import { approveJoinRequestAction } from "@/app/actions/units";
import { Check, X, MessageSquare, Clock } from "lucide-react";

interface UnitJoinRequestsProps {
  requests: {
    request: { id: string, message: string | null, createdAt: Date, expiresAt: Date };
    user: { id: string, name: string | null, email: string };
  }[];
}

export function UnitJoinRequests({ requests }: UnitJoinRequestsProps) {
  async function handleApprove(id: string) {
    const result = await approveJoinRequestAction(id);
    if (!result.success) alert(result.message);
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-12 w-12 rounded-full bg-foreground/[0.02] border border-border/50 flex items-center justify-center">
          <Clock className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <p className="text-sm text-muted-foreground italic">No pending join requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-serif text-foreground">Pending Requests</h3>
      
      <div className="space-y-4">
        {requests.map((r) => (
          <div key={r.request.id} className="p-6 rounded-2xl border border-border/50 bg-card shadow-sm space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-foreground/5 flex items-center justify-center font-serif text-lg text-foreground/70 border border-border/50">
                  {(r.user.name || "").split(" ").map(n => n.charAt(0)).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.user.name}</p>
                  <p className="text-xs text-muted-foreground font-mono tracking-tight">{r.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleApprove(r.request.id)}
                  className="px-4 py-2 bg-foreground text-background rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all flex items-center gap-2"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button className="px-4 py-2 border border-border rounded-lg text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
                  Reject
                </button>
              </div>
            </div>

            {r.request.message && (
              <div className="p-4 rounded-xl bg-foreground/[0.02] border border-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Intro & Expertise</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {r.request.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4 text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expires in 14 days
                </span>
                <span className="text-emerald-600">Terms Accepted</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
