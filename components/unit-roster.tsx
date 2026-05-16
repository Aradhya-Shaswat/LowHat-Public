"use client";

import { initiateRemovalAction } from "@/app/actions/units";
import { UserMinus, MoreVertical } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface UnitRosterProps {
  members: {
    user: { id: string, name: string | null, email: string };
    role: string;
    joinedAt: Date;
  }[];
  unitId: string;
  currentUserRole: string;
  currentUserId: string;
}

export function UnitRoster({ members, unitId, currentUserRole, currentUserId }: UnitRosterProps) {
  async function handleRemove(targetUserId: string) {
    if (!confirm("Are you sure you want to initiate removal for this member? This will start a governance vote or cooling period.")) return;
    const result = await initiateRemovalAction(targetUserId, unitId);
    if (!result.success) alert(result.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-serif text-foreground">Operational Roster</h3>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-foreground/5 rounded">
          {members.length} Members
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map((m) => (
          <div key={m.user.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-foreground/[0.01] hover:bg-foreground/[0.02] transition-all">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-foreground/5 flex items-center justify-center font-serif text-sm text-foreground/70 border border-border/50">
                {(m.user.name || "").split(" ").map(n => n.charAt(0)).join("").slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  {m.user.name}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tight">{m.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-foreground/[0.03] px-2 py-1 rounded">
                {m.role}
              </div>

              {currentUserRole === 'owner' && m.user.id !== currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 hover:bg-foreground/5 rounded transition-colors outline-none">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border-border">
                    <DropdownMenuItem 
                      onClick={() => handleRemove(m.user.id)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/5 text-xs font-medium cursor-pointer"
                    >
                      <UserMinus className="h-3.5 w-3.5 mr-2" />
                      Initiate Removal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
