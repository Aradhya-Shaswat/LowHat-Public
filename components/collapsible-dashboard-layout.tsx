"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ChevronDown, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { SidebarNav } from "@/app/(dashboard)/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { UnitPromoCard } from "@/components/unit-promo-card";
import { HoverInfo } from "@/components/hover-info";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/command-palette";

interface CollapsibleDashboardLayoutProps {
  children: React.ReactNode;
  userName: string;
  initials: string;
  userTeam: any;
  unreadNotificationsCount: number;
  role: string;
}

export function CollapsibleDashboardLayout({
  children,
  userName,
  initials,
  userTeam,
  unreadNotificationsCount,
  role,
}: CollapsibleDashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const pathname = usePathname();
  
  const isProjectPage = /^\/projects\/[^/]+$/.test(pathname);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    }
  }, []);

  const handleToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebar_collapsed", String(newState));
    }
  };

  useEffect(() => {
    if (!isProjectPage) {
      setIsCollapsed(false);
    }
  }, [pathname, isProjectPage]);

  return (
    <div className="flex h-screen overflow-hidden bg-background w-full">
      <aside
        className={cn(
          "flex-shrink-0 border-r border-border bg-card flex flex-col justify-between z-20 relative transition-all duration-300 ease-in-out select-none",
          isProjectPage && isCollapsed ? "w-16" : "w-64"
        )}
      >
        {isProjectPage && !isCollapsed && mounted && (
          <button
            onClick={handleToggle}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 flex h-16 w-4 items-center justify-center rounded-r-md border border-l-0 border-border bg-card shadow-sm cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 outline-none"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
        )}

        {isProjectPage && isCollapsed && mounted && (
          <button
            onClick={handleToggle}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 flex h-16 w-4 items-center justify-center rounded-r-md border border-l-0 border-border bg-card shadow-sm cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 outline-none"
            title="Expand sidebar"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {isCollapsed ? (
            <div className="h-20 flex items-center border-b border-border overflow-hidden relative w-full select-none">
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes marquee {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .retro-marquee-wrapper {
                  display: flex;
                  white-space: nowrap;
                  width: max-content;
                  animation: marquee 3.5s linear infinite;
                }
              `}} />
              <Link href="/" className="w-full flex items-center justify-center group" title="LowHat">
                <div className="dark:hidden flex items-center justify-center w-full">
                  <img src="/logo.png" alt="LowHat Logo" className="h-14 w-auto object-contain" />
                </div>
                <div className="hidden dark:block w-full">
                  <div className="retro-marquee-wrapper font-jersey text-3xl tracking-normal text-foreground">
                    <span>LowHat&nbsp;&nbsp;&nbsp;LowHat&nbsp;&nbsp;&nbsp;</span>
                    <span>LowHat&nbsp;&nbsp;&nbsp;LowHat&nbsp;&nbsp;&nbsp;</span>
                  </div>
                </div>
              </Link>
            </div>
          ) : (
            <div className="h-20 flex items-center px-6 border-b border-border">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="font-jersey text-3xl tracking-normal text-foreground">LowHat</span>
              </Link>
            </div>
          )}
          
          <nav className={cn("space-y-1", isCollapsed ? "p-2 pt-4" : "p-4 pt-8")}>
            {!isCollapsed && (
              <div className="mb-8 px-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search... (Ctrl+K)"
                    className="pl-9 pr-4 py-2 bg-muted/50 border-none rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full font-sans transition-all focus:bg-background cursor-pointer"
                    onClick={() => setCommandPaletteOpen(true)}
                    readOnly
                  />
                </div>
              </div>
            )}

            <SidebarNav role={role} hasUnit={!!userTeam} isCollapsed={isCollapsed} />
          </nav>
        </div>

        <div className={cn("border-t border-border flex flex-col", isCollapsed ? "p-2 gap-3" : "p-4 gap-4")}>
          {!isCollapsed && role === "freelancer" && (
            userTeam ? (
              <details className="mx-0 mt-4 group">
                <summary className="flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground hover:bg-secondary/30 rounded-md transition-all outline-none h-10">
                  <span className="truncate">Execution unit</span>
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 -mr-3">
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </div>
                </summary>
                <div className="flex flex-col gap-3 pl-6 pr-3 py-1 mt-1 border-l-2 border-border/30 ml-5">
                  <div className="text-sm font-serif text-foreground">
                    <HoverInfo identifier={userTeam.id} type="unit">
                      {userTeam.name}
                    </HoverInfo>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Reputation</span>
                    <span className="text-foreground">5.0 / 5</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="text-emerald-600 font-medium">High</span>
                  </div>
                </div>
              </details>
            ) : (
              <UnitPromoCard />
            )
          )}

          {isCollapsed ? (
            <div className="flex flex-col items-center gap-4">
              <Link 
                href="/notifications" 
                className="relative h-11 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors mx-auto shrink-0" 
                title="Inbox"
              >
                <MessageSquare size={22} className="shrink-0" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card animate-pulse" />
                )}
              </Link>
              <ThemeToggle className="h-11 w-11 hover:bg-foreground/5 mx-auto flex items-center justify-center shrink-0" iconClassName="h-[22px] w-[22px]" />
              <div className="flex flex-col items-center gap-4 border-t border-border/40 pt-4 w-full">
                <Link href="/profile" className="h-8 w-8 rounded-full bg-foreground text-background text-xs font-semibold flex items-center justify-center hover:opacity-90 transition-opacity font-sans mx-auto shrink-0" title="Profile">
                  {initials}
                </Link>
                <LogoutButton className="h-11 w-11 hover:bg-foreground/5 mx-auto flex items-center justify-center shrink-0" iconClassName="h-[22px] w-[22px]" />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1 px-0 h-10 group">
                <Link href="/notifications" className="flex-1 flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-secondary/30 hover:text-foreground font-medium text-sm transition-colors font-sans overflow-hidden">
                  <span className="truncate flex items-center gap-2">
                    Inbox
                    {unreadNotificationsCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </span>
                </Link>
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <ThemeToggle />
                </div>
              </div>
              
              <div className="flex items-center justify-between px-0 h-10 group rounded-md transition-colors">
                <Link href="/profile" className="flex-1 flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/30 rounded-md transition-colors font-sans cursor-pointer overflow-hidden">
                  <span className="h-7 w-7 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center transition-colors flex-shrink-0 font-sans">
                    {initials}
                  </span>
                  <div className="flex flex-col truncate">
                    <span className="text-sm font-medium text-foreground truncate">Profile</span>
                  </div>
                </Link>
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                  <LogoutButton />
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto w-full bg-background relative isolate">
        {children}
      </main>
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} role={role} hasUnit={!!userTeam} />
    </div>
  );
}
