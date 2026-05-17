"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getOpenJobsAction } from "@/app/actions/jobs";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: string;
  hasUnit?: boolean;
}

export function CommandPalette({ open, onOpenChange, role = "freelancer", hasUnit = false }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (open) {
      getOpenJobsAction().then((data) => {
        if (Array.isArray(data)) {
          setJobs(data);
        }
      });
    }
  }, [open]);

  const commands = useMemo(() => {
    const baseCommands = [
      { title: "Profile", action: () => router.push("/profile") },
      { title: "Change Theme", action: () => setTheme(theme === "light" ? "dark" : "light") },
      { title: "Sign Out", action: async () => { await authClient.signOut(); window.location.href = "/login"; } },
    ];

    const roleCommands = [];
    if (role === "client") {
      roleCommands.push(
        { title: "Marketplace", action: () => router.push("/") },
        { title: "My Postings", action: () => router.push("/my-jobs") },
        { title: "Active Projects", action: () => router.push("/projects") },
      );
    } else if (role === "freelancer") {
      roleCommands.push(
        { title: "Marketplace", action: () => router.push("/") },
        { title: "Active Executions", action: () => router.push("/projects") },
        { title: "Find Units", action: () => router.push("/find-units") },
      );
      if (hasUnit) {
        roleCommands.push({ title: "My Unit", action: () => router.push("/my-unit") });
      }
    }

    return [...roleCommands, ...baseCommands];
  }, [role, hasUnit, router, theme, setTheme]);

  const filteredCommands = useMemo(() => {
    return commands.filter(cmd =>
      cmd.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [commands, query]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job =>
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.description.toLowerCase().includes(query.toLowerCase())
    );
  }, [jobs, query]);

  const allItems = useMemo(() => [
    ...filteredCommands.map(cmd => ({ type: "command", ...cmd })),
    ...filteredJobs.map(job => ({ type: "job", ...job }))
  ], [filteredCommands, filteredJobs]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, allItems]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }

      if (!open || allItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const activeItem = allItems[selectedIndex];
        if (activeItem) {
          if (activeItem.type === "command") {
            activeItem.action();
          } else if (activeItem.type === "job") {
            router.push(`/jobs/${activeItem.id}`);
          }
          onOpenChange(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, allItems, selectedIndex, router]);

  let currentItemIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-background border-border">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground mr-2" />
          <input
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground focus:ring-0 focus:outline-none"
            placeholder="Search or navigate..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1">Commands</div>
              {filteredCommands.map((cmd) => {
                const isSelected = currentItemIndex === selectedIndex;
                currentItemIndex++;
                return (
                  <button
                    key={cmd.title}
                    className={cn(
                      "w-full text-left px-2 py-2 text-sm rounded-md transition-colors flex items-center justify-between group",
                      isSelected ? "bg-muted" : "hover:bg-muted"
                    )}
                    onClick={() => {
                      cmd.action();
                      onOpenChange(false);
                    }}
                  >
                    <span className="font-medium text-foreground">{cmd.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredJobs.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1">Jobs</div>
              {filteredJobs.map((job) => {
                const isSelected = currentItemIndex === selectedIndex;
                currentItemIndex++;
                return (
                  <button
                    key={job.id}
                    className={cn(
                      "w-full text-left px-2 py-2 text-sm rounded-md transition-colors flex flex-col gap-0.5 group",
                      isSelected ? "bg-muted" : "hover:bg-muted"
                    )}
                    onClick={() => {
                      router.push(`/jobs/${job.id}`);
                      onOpenChange(false);
                    }}
                  >
                    <span className="font-medium text-foreground group-hover:text-foreground/80">{job.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{job.description}</span>
                  </button>
                );
              })}
            </div>
          )}

          {allItems.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
