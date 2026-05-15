"use client";

import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth";

export function LogoutButton() {
  const handleLogout = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  return (
    <button 
      onClick={handleLogout} 
      className="flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:bg-secondary/30 hover:text-foreground transition-colors shrink-0"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
