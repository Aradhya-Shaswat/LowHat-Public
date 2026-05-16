"use client";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth";

export function LogoutButton() {
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
      className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-secondary/30 hover:text-foreground transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      title={isPending ? "Signing out..." : "Sign out"}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
    </button>
  );
}
