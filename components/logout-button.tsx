"use client";

import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth";

export function LogoutButton() {
  const handleLogout = async () => {
    await authClient.signOut({
       fetchOptions: {
          onSuccess: () => {
             window.location.href = "/login";
          }
       }
    });
  };

  return (
    <button 
      onClick={handleLogout} 
      className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted ml-2 transition-colors"
      title="Sign out"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
