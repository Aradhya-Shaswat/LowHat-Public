import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SidebarNav } from "./sidebar-nav";
import { LogoutButton } from "@/components/logout-button";

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col justify-between z-10 relative">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-heading text-2xl tracking-normal text-foreground">LowHat</span>
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
        
        <div className="p-4 border-t border-border space-y-1">
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
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 overflow-y-auto w-full bg-background relative isolate">
        {children}
      </main>
    </div>
  );
}