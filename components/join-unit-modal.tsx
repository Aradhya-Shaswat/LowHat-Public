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
        <button className="text-xs font-semibold text-foreground hover:opacity-80 transition-opacity font-sans">
          Request to join →
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
          <div className="space-y-4">
            <label className="text-xs font-semibold text-foreground font-sans px-1">Intro & Expertise</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Why do you want to join? What do you bring to the unit?" 
              className="w-full bg-transparent border-b border-border/50 py-2 text-sm outline-none focus:border-foreground transition-all h-32 resize-none font-sans"
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

          <DialogFooter className="pt-4">
            <button 
              type="submit" 
              disabled={isPending || !accepted}
              className="w-full py-4 bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 font-sans"
            >
              {isPending ? "Submitting..." : "Submit join request"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
