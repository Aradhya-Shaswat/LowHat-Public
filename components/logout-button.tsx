"use client";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function LogoutButton({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    try {
      setIsPending(true);
      await authClient.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      setIsPending(false);
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      disabled={isPending}
      className={cn("flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-secondary/30 hover:text-foreground transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed", className)}
      title={isPending ? "Signing out..." : "Sign out"}
    >
      {isPending ? (
        <Loader2 className={cn("h-4 w-4 animate-spin", iconClassName)} />
      ) : (
        <LogOut className={cn("h-4 w-4", iconClassName)} />
      )}
    </button>
  );
}
