"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({ role }: { role: string }) {
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
        return [
          { href: "/", label: "Marketplace" },
          { href: "/projects", label: "Active Executions" },
          { href: "/team", label: "My Unit (Team)" },
        ];
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
              "block px-3 py-2 rounded-md font-medium text-sm transition-colors font-sans",
              isActive
                ? "bg-foreground/5 text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
