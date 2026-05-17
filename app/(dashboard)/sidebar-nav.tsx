"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Globe, Briefcase, FileText, Search, Component, ShieldAlert } from "lucide-react";

interface SidebarNavProps {
  role: string;
  hasUnit?: boolean;
  isCollapsed?: boolean;
}

const getIcon = (label: string) => {
  switch (label) {
    case "Marketplace":
    case "Global Job Feed":
      return <Globe size={22} className="shrink-0" />;
    case "My Postings":
      return <FileText size={22} className="shrink-0" />;
    case "Active Projects":
    case "Active Executions":
      return <Briefcase size={22} className="shrink-0" />;
    case "Find Units":
      return <Search size={22} className="shrink-0" />;
    case "My Unit":
      return <Component size={22} className="shrink-0" />;
    case "Moderation":
      return <ShieldAlert size={22} className="shrink-0" />;
    default:
      return <Globe size={22} className="shrink-0" />;
  }
};

export function SidebarNav({ role, hasUnit, isCollapsed }: SidebarNavProps) {
  const pathname = usePathname();

  const getLinks = () => {
    switch (role) {
      case "client":
        return [
          { href: "/", label: "Marketplace" },
          { href: "/my-jobs", label: "My Postings" },
          { href: "/projects", label: "Active Projects" },
        ];
      case "freelancer":
        const freelancerLinks = [
          { href: "/", label: "Marketplace" },
          { href: "/projects", label: "Active Executions" },
          { href: "/find-units", label: "Find Units" },
        ];
        if (hasUnit) {
          freelancerLinks.push({ href: "/my-unit", label: "My Unit" });
        }
        return freelancerLinks;
      case "admin":
        return [
          { href: "/", label: "Global Job Feed" },
          { href: "/admin/moderation", label: "Moderation" },
        ];
      default:
        return [
          { href: "/", label: "Marketplace" }
        ];
    }
  };

  const links = getLinks();

  return (
    <>
      {links.map((link) => {
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md font-medium transition-colors font-sans",
              isCollapsed 
                ? "h-11 w-11 mx-auto flex items-center justify-center hover:bg-foreground/5" 
                : "block px-3 py-2 text-sm",
              isActive
                ? "bg-foreground/5 text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
            title={link.label}
          >
            {isCollapsed ? getIcon(link.label) : link.label}
          </Link>
        );
      })}
    </>
  );
}
