"use client";

import { Check, HelpCircle, Pencil } from "lucide-react";
import { useState } from "react";
import { HoverInfo } from "./hover-info";
import { TeamEditForm } from "./team-edit-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UnitHeaderProps {
  unit: {
    id: string;
    name: string;
    description: string | null;
    moderationStatus: string;
    state: string;
  };
  userRole: string;
}

export function UnitHeader({ unit, userRole }: UnitHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const canEdit = userRole === 'owner' || userRole === 'manager';

  return (
    <div className="space-y-6 pb-8 border-b border-border/50">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-serif text-foreground">
              <HoverInfo identifier={unit.id} type="unit">
                {unit.name}
              </HoverInfo>
            </h1>
            
            {canEdit && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <button 
                    className="p-1 rounded-full hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-all"
                    title="Edit Unit Details"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none shadow-none bg-transparent">
                  <DialogTitle className="sr-only">Edit Unit Details</DialogTitle>
                  <TeamEditForm 
                    teamId={unit.id} 
                    currentName={unit.name} 
                    currentDescription={unit.description}
                    moderationStatus={unit.moderationStatus as any}
                    onSuccess={() => setIsOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}

            {unit.moderationStatus === "approved" ? (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20" title="Verified Unit">
                <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </span>
            ) : (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20" title="Verification Pending">
                <HelpCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </span>
            )}
            <span className="text-[10px] font-medium px-1.5 py-0.5 text-muted-foreground uppercase tracking-widest border border-border/30 font-sans">
              {unit.state.charAt(0).toUpperCase() + unit.state.slice(1)}
            </span>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            {unit.description || "No operational mandate provided."}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest font-sans">My role</p>
            <p className="text-xl font-semibold text-foreground font-sans">
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </p>
          </div>
          <div className="h-10 w-[1px] bg-border/50" />
          <div className="text-right space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest font-sans">Reputation</p>
            <p className="text-xl font-semibold text-foreground font-sans">5.0 / 5.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
