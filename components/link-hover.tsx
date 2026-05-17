"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { ExternalLink, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkHoverProps {
  url: string;
  className?: string;
  isMe?: boolean;
}

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof window === "undefined") return null;
  return ReactDOM.createPortal(children, document.body);
}

export function LinkHover({ url, className, isMe }: LinkHoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch (e) {
    hostname = url;
  }

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const cardWidth = 280;
    
    let left = rect.left + window.scrollX + (rect.width - cardWidth) / 2;
    
    if (left < 16) {
      left = 16;
    } else if (left + cardWidth > window.innerWidth - 16) {
      left = window.innerWidth - cardWidth - 16;
    }
    
    const cardHeight = 120;
    let top = rect.bottom + window.scrollY + 8;
    
    if (rect.bottom + cardHeight > window.innerHeight && rect.top > cardHeight) {
      top = rect.top + window.scrollY - cardHeight - 8;
    }
    
    setCoords({ top, left });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    enterTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 200); 
  };

  const handleMouseLeave = () => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    leaveTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <>
      <a
        ref={triggerRef}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "inline-flex items-center gap-1 font-semibold underline underline-offset-4 decoration-1 hover:opacity-85 transition-opacity font-sans break-all",
          isMe 
            ? "text-background decoration-background/50 hover:decoration-background" 
            : "text-primary decoration-primary/40 hover:decoration-primary",
          className
        )}
      >
        {url} <ExternalLink className="w-3 h-3 shrink-0" />
      </a>

      {isOpen && (
        <Portal>
          <div
            ref={cardRef}
            onMouseEnter={() => {
              if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
            }}
            onMouseLeave={handleMouseLeave}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className="absolute z-50 w-[280px] bg-card/95 backdrop-blur-md border border-border shadow-xl p-4 select-none pointer-events-auto rounded-lg text-left animate-in fade-in zoom-in-95 duration-150 font-sans"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Globe className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground truncate">{hostname}</h4>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                  External URL. Click to open in a new browser tab.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[10px] font-medium text-primary">
                  Open link <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
