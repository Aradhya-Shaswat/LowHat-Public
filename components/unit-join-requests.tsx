"use client";

import { approveJoinRequestAction, rejectJoinRequestAction } from "@/app/actions/units";
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

  async function handleReject(id: string) {
    const result = await rejectJoinRequestAction(id);
    if (!result.success) alert(result.message);
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-35 text-center space-y-6">
        {/* <div className="h-16 w-16 flex items-center justify-center border border-border/50 bg-foreground/[0.02]">
          <Clock className="h-6 w-6 text-muted-foreground/30" />
        </div> */}
        <p className="text-sm text-muted-foreground font-sans">No pending join requests.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-serif text-foreground">Pending Join Requests</h3>
      
      <div className="flex flex-col border-t border-border/30">
        {requests.map((r) => (
          <div key={r.request.id} className="py-10 border-b border-border/50 space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 flex items-center justify-center font-serif text-xl text-foreground/40 border border-border/50 bg-foreground/[0.02]">
                  {(r.user.name || "").split(" ").map(n => n.charAt(0)).join("").slice(0, 2)}
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground font-sans leading-none">{r.user.name}</p>
                  <p className="text-xs text-muted-foreground font-sans">{r.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleApprove(r.request.id)}
                  className="px-6 py-2 bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all font-sans"
                >
                  Approve
                </button>
                <button 
                  onClick={() => handleReject(r.request.id)}
                  className="px-6 py-2 border border-border text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all font-sans"
                >
                  Reject
                </button>
              </div>
            </div>

            {r.request.message && (
              <div className="space-y-3 max-w-3xl">
                <p className="text-xs font-semibold text-muted-foreground font-sans uppercase tracking-wider">Intro & Expertise</p>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  {r.request.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-sans">
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Expires in 14 days
                </span>
                <span className="text-emerald-600">Terms accepted</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
