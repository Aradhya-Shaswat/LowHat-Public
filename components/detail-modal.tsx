"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function DetailModal({ isOpen, onClose, title, children }: DetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!mounted) return null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-64 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-24 overflow-hidden">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl max-h-full bg-background border border-border shadow-2xl rounded-sm flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
        <header className="flex flex-col items-center justify-center p-10 border-b border-border/50 shrink-0 text-center relative">
          <h2 className="text-4xl font-serif text-foreground leading-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-secondary/50 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
