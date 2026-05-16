"use client";

import { useState } from "react";
import { submitJoinRequestAction } from "@/app/actions/units";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface JoinUnitModalProps {
  unitId: string;
  unitName: string;
}

export function JoinUnitModal({ unitId, unitName }: JoinUnitModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    
    const formData = new FormData();
    formData.append("teamId", unitId);
    formData.append("message", message);
    if (accepted) formData.append("termsAccepted", "on");

    const result = await submitJoinRequestAction(formData);
    
    setIsPending(false);
    if (result?.success) {
      setIsOpen(false);
      
    } else {
      
      alert(result?.message || "Failed to submit request.");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="w-full py-2 border border-border rounded-lg text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all">
          Request to Join
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Join {unitName}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Introduce yourself to the unit leadership and accept the operational terms.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Intro & Expertise</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Why do you want to join? What do you bring to the unit?" 
              className="w-full px-4 py-3 bg-foreground/[0.02] border border-border/50 rounded-xl text-sm outline-none focus:border-foreground/20 focus:bg-foreground/[0.04] h-24 resize-none transition-all"
            />
          </div>
          
          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              id="modalTerms"
              className="mt-1 h-4 w-4 rounded border-border text-foreground focus:ring-foreground"
            />
            <label htmlFor="modalTerms" className="text-[11px] text-muted-foreground leading-relaxed">
              I accept the Unit Agreements, including handover obligations and professional governance rules.
            </label>
          </div>

          <DialogFooter>
            <button 
              type="submit" 
              disabled={isPending || !accepted}
              className="w-full bg-foreground text-background hover:bg-foreground/90 h-10 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            >
              {isPending ? "Submitting..." : "Submit Join Request"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
