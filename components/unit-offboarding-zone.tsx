"use client";

import { Timer, Download, Upload, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UnitOffboardingZoneProps {
  request: {
    id: string;
    coolingEndsAt: Date | null;
  };
  unitId: string;
}

export function UnitOffboardingZone({ request, unitId }: UnitOffboardingZoneProps) {
  return (
    <div className="p-8 rounded-3xl bg-amber-500/[0.03] border-2 border-amber-500/20 shadow-lg space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-serif text-foreground">Isolated Offboarding Zone</h2>
              <p className="text-xs text-amber-700/70 font-medium uppercase tracking-widest">Cooling Period Active</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Your membership is being phased out. You have 24 hours of isolated access to complete knowledge transfer, export your files, and finalize handover deliverables.
          </p>
        </div>

        <div className="bg-background border border-amber-500/30 rounded-2xl p-4 min-w-[200px] shadow-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Time Remaining</p>
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 text-amber-600 animate-pulse" />
            <span className="text-2xl font-mono font-bold text-foreground tracking-tight">14:21:05</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-background border border-border/50 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Handover Assets</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/[0.02] border border-border/30">
              <span className="text-xs font-medium">Technical Docs</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-foreground/[0.02] border border-border/30">
              <span className="text-xs font-medium">Access Keys</span>
              <div className="h-2 w-2 rounded-full bg-amber-500" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-background border border-border/50 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Isolated Uploads</h4>
          <button className="w-full h-24 border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-foreground/[0.01] transition-all">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Drop Transfer Files</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-background border border-border/50 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Resource Export</h4>
          <button className="w-full py-3 bg-foreground text-background rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all">
            <Download className="h-4 w-4" />
            Export My Data
          </button>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <p className="text-[11px] text-amber-800/80 leading-relaxed italic text-center">
          "Professional execution units prioritize clean operational closure. Ensure all critical ownership transfers are initiated before the cooling period expires."
        </p>
      </div>
    </div>
  );
}
