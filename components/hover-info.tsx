"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { getUnitHoverInfo, getFreelancerHoverInfo } from "@/app/actions/hover";
import { cn } from "@/lib/utils";

interface HoverInfoProps {
  children: React.ReactNode;
  identifier: string; 
  type: "unit" | "freelancer";
  className?: string;
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

export function HoverInfo({ children, identifier, type, className }: HoverInfoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  const fetchData = async () => {
    if (data) return; 
    setLoading(true);
    try {
      const res = type === "unit" 
        ? await getUnitHoverInfo(identifier) 
        : await getFreelancerHoverInfo(identifier);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const cardWidth = 320;
    
    let left = rect.left + window.scrollX + (rect.width - cardWidth) / 2;
    
    if (left < 16) {
      left = 16;
    } else if (left + cardWidth > window.innerWidth - 16) {
      left = window.innerWidth - cardWidth - 16;
    }
    
    const estimatedHeight = 220;
    let top = rect.bottom + window.scrollY + 8;
    
    if (rect.bottom + estimatedHeight > window.innerHeight && rect.top > estimatedHeight) {
      top = rect.top + window.scrollY - estimatedHeight - 8;
    }
    
    setCoords({ top, left });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      setTimeout(() => {
        if (!triggerRef.current || !cardRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const cardHeight = cardRef.current.offsetHeight;
        let top = rect.bottom + window.scrollY + 8;
        
        if (rect.bottom + cardHeight > window.innerHeight && rect.top > cardHeight) {
          top = rect.top + window.scrollY - cardHeight - 8;
        }
        setCoords(prev => ({ ...prev, top }));
      }, 0);
    }
  }, [isOpen, loading, data]);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    
    enterTimeoutRef.current = setTimeout(() => {
      fetchData();
      setIsOpen(true);
    }, 250); 
  };

  const handleMouseLeave = () => {
    if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
    
    leaveTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "inline-block cursor-help border-b border-dashed border-foreground/30 hover:border-foreground/80 transition-colors duration-150",
          className
        )}
      >
        {children}
      </span>

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
            className="absolute z-50 w-[320px] bg-card border border-border shadow-xl p-5 select-none pointer-events-auto rounded-lg text-left animate-in fade-in zoom-in-95 duration-150"
          >
            {loading ? (
              <div className="space-y-4 font-sans">
                <div className="h-5 bg-muted rounded w-2/3 animate-pulse" />
                <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                <div className="grid grid-cols-2 gap-4 pt-3">
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 bg-muted rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  </div>
                </div>
                <div className="h-10 bg-muted rounded w-full animate-pulse pt-2" />
              </div>
            ) : !data ? (
              <div className="text-xs text-muted-foreground font-sans py-4 text-center">
                Context details unavailable
              </div>
            ) : type === "unit" ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif text-lg font-light text-foreground leading-tight">
                    {data.name}
                  </h4>
                  <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans">
                    Operational Collective
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 border-t border-border/40">
                  <div>
                    <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block">
                      Established
                    </span>
                    <span className="text-sm font-semibold text-foreground font-sans">
                      {formatDate(data.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block">
                      Collective Capacity
                    </span>
                    <span className="text-sm font-semibold text-foreground font-sans">
                      {data.memberCount} {data.memberCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block">
                      Reputation
                    </span>
                    <span className="text-sm font-semibold text-foreground font-sans">
                      {data.reputation}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block">
                      Active Bids
                    </span>
                    <span className="text-sm font-semibold text-foreground font-sans">
                      {data.activeBids} pending
                    </span>
                  </div>
                </div>

                {data.description && (
                  <div className="pt-3 border-t border-border/40">
                    <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block mb-1">
                      Operational Mandate
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans line-clamp-3">
                      {data.description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif text-lg font-light text-foreground leading-tight">
                    {data.name}
                  </h4>
                  <span className="text-[9px] font-light tracking-widest text-primary uppercase font-sans block mt-0.5">
                    {data.title}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 border-t border-border/40">
                  {data.role === "client" ? (
                    <>
                      <div>
                        <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block">
                          Company Name
                        </span>
                        <span className="text-sm font-semibold text-foreground font-sans truncate block max-w-full">
                          {data.companyName || "Not specified"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block">
                          Industry
                        </span>
                        <span className="text-sm font-semibold text-foreground font-sans truncate block max-w-full">
                          {data.industry || "Not specified"}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block">
                          Hourly Rate
                        </span>
                        <span className="text-sm font-semibold text-foreground font-sans">
                          {data.hourlyRate ? `$${data.hourlyRate.toFixed(2)}/hr` : "No rate set"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block">
                          Unit Collective
                        </span>
                        <span className="text-sm font-semibold text-foreground font-sans truncate block max-w-full">
                          {data.unitName || "Independent"}
                        </span>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block">
                      Reputation
                    </span>
                    <span className="text-sm font-semibold text-foreground font-sans">
                      {data.reputation}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block">
                      Joined
                    </span>
                    <span className="text-sm font-semibold text-foreground font-sans">
                      {formatDate(data.createdAt)}
                    </span>
                  </div>
                </div>

                {data.bio && (
                  <div className="pt-3 border-t border-border/40">
                    <span className="text-[9px] font-medium tracking-widest text-muted-foreground uppercase font-sans block mb-1">
                      Professional Background
                    </span>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans line-clamp-3">
                      {data.bio}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Portal>
      )}
    </>
  );
}
