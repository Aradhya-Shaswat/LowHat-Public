"use client";

import { useState, useEffect } from "react";

interface UnitOffboardingZoneProps {
  request: {
    id: string;
    coolingEndsAt: Date | null;
  };
  unitId: string;
}

export function UnitOffboardingZone({ request, unitId }: UnitOffboardingZoneProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="pb-12 border-b border-border/50 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-3xl font-serif text-foreground tracking-tight">Isolated Offboarding Zone</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Operational Cooling Period Active</p>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Your membership is being phased out. You have isolated access to complete knowledge transfer, export your files, and finalize handover deliverables.
          </p>
        </div>

        <div className="min-w-[200px] md:text-right">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Time Remaining</p>
          <div className="flex items-baseline gap-1 md:justify-end">
            <span className="text-4xl font-mono font-bold text-foreground tabular-nums tracking-tighter">
              {getRemainingTime(request.coolingEndsAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex flex-col space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">Handover Assets</h4>
          <div className="space-y-3 px-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground/80">Technical Docs</span>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground/80">Access Keys</span>
              <span className="text-[10px] font-bold text-amber-600 uppercase">Pending</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">Isolated Uploads</h4>
          <button className="w-full h-24 border border-dashed border-border flex flex-col items-center justify-center gap-1.5 hover:bg-foreground/[0.02] transition-all group">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground group-hover:underline decoration-1 underline-offset-4">Drop Transfer Files</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Maximum 500MB per file</span>
          </button>
        </div>

        <div className="flex flex-col space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/50">Resource Export</h4>
          <button className="w-full h-24 bg-foreground text-background text-[11px] font-bold uppercase tracking-wider hover:bg-foreground/90 transition-all">
            Export Final Data Package
          </button>
        </div>
      </div>
    </div>
  );
}

