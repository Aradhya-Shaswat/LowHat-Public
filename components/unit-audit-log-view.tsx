"use client";

import { History, User, Info } from "lucide-react";

interface UnitAuditLogViewProps {
  logs: {
    log: { id: string, action: string, details: string | null, createdAt: Date };
    actor: { name: string | null, email: string };
  }[];
}

export function UnitAuditLogView({ logs }: UnitAuditLogViewProps) {
  function formatDetails(details: string | null) {
    if (!details) return null;
    try {
      const data = JSON.parse(details);
      const entries = Object.entries(data);
      if (entries.length === 0) return null;
      
      return entries
        .map(([key, value]) => {
          const val = typeof value === 'string' && value.length > 20 ? `${value.slice(0, 8)}...` : value;
          return `${key}: ${val}`;
        })
        .join(" | ");
    } catch {
      return details;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif text-foreground">Operational Audit Trail</h3>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-foreground/5 rounded">
          Last 20 Actions
        </span>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
        <div className="divide-y divide-border/30">
          {logs.map((l) => (
            <div key={l.log.id} className="p-4 flex items-start gap-4 hover:bg-foreground/[0.01] transition-all">
              <div className="h-8 w-8 rounded-full bg-foreground/[0.03] border border-border/30 flex items-center justify-center shrink-0">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {l.log.action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                    {new Date(l.log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    {l.actor.name}
                  </p>
                  {l.log.details && (
                    <p className="text-[10px] text-muted-foreground/60 font-mono bg-foreground/[0.02] px-1.5 py-0.5 rounded truncate max-w-md">
                      {formatDetails(l.log.details)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground italic">
              No audit records found.
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
        <Info className="h-4 w-4 text-blue-600" />
        <p className="text-xs text-blue-700/80 leading-relaxed">
          Audit logs are immutable and provide a forensic record of all governance and operational shifts within the unit.
        </p>
      </div>
    </div>
  );
}
