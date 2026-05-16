import Link from "next/link";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { db } from "@/lib/db";
import { teams, teamMembers, notifications } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  
  if (!session?.isAuth) {
    redirect("/login");
  }

  const { role } = session;

  let userTeam = null;
  if (role === "freelancer") {
    const tm = await db.select({ team: teams })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, session.userId))
      .limit(1);
    if (tm.length > 0) {
      userTeam = tm[0].team;
    }
  }

    const unreadNotificationsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, session.userId), eq(notifications.isRead, false)))
      .then(res => Number(res[0].count));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col justify-between z-10 relative">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="h-20 flex items-center px-6 border-b border-border">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-jersey text-3xl tracking-normal text-foreground">LowHat</span>
            </Link>
          </div>
          <nav className="p-4 pt-8 space-y-1">
            <div className="mb-8 px-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-9 pr-4 py-2 bg-muted/50 border-none rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full font-sans transition-all focus:bg-background"
                />
              </div>
            </div>

            <SidebarNav role={role} />

          </nav>
        </div>
        
        <div className="p-4 border-t border-border flex flex-col gap-4">
          {role === "freelancer" && (
            userTeam ? (
              <details className="mx-0 mt-4 group">
                <summary className="flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground hover:bg-secondary/30 rounded-md transition-all outline-none h-10">
                  <span className="truncate">Execution unit</span>
                  <div className="w-10 h-10 flex items-center justify-center shrink-0 -mr-3">
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </div>
                </summary>
                <div className="flex flex-col gap-3 pl-6 pr-3 py-1 mt-1 border-l-2 border-border/30 ml-5">
                  <div className="text-sm font-serif text-foreground">{userTeam.name}</div>
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
              <div className="px-3 py-3 mt-4 rounded-md bg-secondary/30 text-left flex flex-col gap-2">
                <h4 className="text-sm font-serif text-foreground">Operational Unit</h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed tracking-wider">Form a collective to execute on contracts.</p>
                <Link href="/create-unit" className="text-xs font-medium text-foreground hover:underline mt-1">
                  Initialize Unit →
                </Link>
              </div>
            )
          )}

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
                <span className="h-7 w-7 rounded-full bg-foreground text-background text-[10px] flex items-center justify-center font-bold transition-colors flex-shrink-0 font-serif">
                  {role.charAt(0).toUpperCase()}
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
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto w-full bg-background relative isolate">
        {children}
      </main>
    </div>
  );
}