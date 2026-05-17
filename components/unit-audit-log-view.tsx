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
        <h3 className="text-2xl font-serif text-foreground">Operational Audit Trail</h3>
        <span className="text-xs font-medium text-muted-foreground font-sans">
          Last 20 actions
        </span>
      </div>

      <div className="flex flex-col border-t border-border/30">
        {logs.map((l) => (
          <div key={l.log.id} className="py-6 border-b border-border/50 flex items-start gap-4 transition-all group">
            <div className="h-8 w-8 flex items-center justify-center shrink-0 border border-border/50 bg-foreground/[0.02]">
              <History className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground font-sans">
                  {l.log.action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </p>
                <span className="text-[10px] text-muted-foreground font-sans tabular-nums">
                  {new Date(l.log.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <p className="text-xs text-muted-foreground flex items-center gap-2 font-sans">
                  <User className="h-3 w-3" />
                  {l.actor.name}
                </p>
                {l.log.details && (
                  <p className="text-[10px] text-muted-foreground/50 font-sans truncate max-w-md">
                    {formatDetails(l.log.details)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground font-sans">
            No audit records found.
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 py-4 border-t border-border/30">
        <Info className="h-4 w-4 text-blue-600/60" />
        <p className="text-xs text-muted-foreground leading-relaxed font-sans">
          Audit logs are immutable and provide a forensic record of all governance and operational shifts within the unit.
        </p>
      </div>
    </div>
  );
}
