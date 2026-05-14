import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";
import { LogoutButton } from "@/components/logout-button";
import { db } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
              <details className="mx-3 mt-4 group">
                <summary className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none mb-2 hover:text-foreground transition-colors outline-none">
                  Execution Unit
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="flex flex-col gap-3 pl-3 border-l border-border/50 ml-1 py-1 mt-3">
                  <div className="text-sm font-serif text-foreground">{userTeam.name}</div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Reputation</span>
                    <span className="text-foreground">5.0 / 5</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="text-primary font-medium">High</span>
                  </div>
                </div>
              </details>
            ) : (
              <div className="px-4 py-3 mx-2 mt-4 rounded-md bg-secondary/30 text-left flex flex-col gap-2">
                <h4 className="text-sm font-serif text-foreground">Join a Team</h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-wider">Form a unit to bid.</p>
                <Link href="/team" className="text-xs font-medium text-foreground hover:underline mt-1">
                  Initialize Unit →
                </Link>
              </div>
            )
          )}

          <div className="space-y-1">
          <Link href="/notifications" className="block px-3 py-2 rounded-md text-muted-foreground hover:bg-secondary/30 hover:text-foreground font-medium text-sm transition-colors font-sans">
            Inbox
          </Link>
          <div className="flex items-center justify-between px-3 py-2 group rounded-md hover:bg-secondary/30 transition-colors">
            <Link href="/profile" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors font-sans cursor-pointer flex-1 py-1">
              <span className="h-8 w-8 rounded-full bg-foreground text-background text-xs flex items-center justify-center font-medium transition-colors flex-shrink-0 font-serif">
                {role.charAt(0).toUpperCase()}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Profile</span>
                <span className="text-[10px] uppercase font-sans tracking-widest text-muted-foreground">{role}</span>
              </div>
            </Link>
            <LogoutButton />
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