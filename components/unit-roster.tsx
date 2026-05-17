"use client";

import { initiateRemovalAction } from "@/app/actions/units";
import { UserMinus, MoreVertical } from "lucide-react";
import { HoverInfo } from "./hover-info";
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
  removalTargetIds: string[];
}

export function UnitRoster({ members, unitId, currentUserRole, currentUserId, removalTargetIds }: UnitRosterProps) {
  async function handleRemove(targetUserId: string) {
    if (!confirm("Are you sure you want to initiate removal for this member? This will start a governance vote or cooling period.")) return;
    const result = await initiateRemovalAction(targetUserId, unitId);
    if (!result.success) alert(result.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-serif text-foreground">Operational Roster</h3>
        <span className="text-xs font-medium text-muted-foreground font-sans">
          {members.length} members
        </span>
      </div>

      <div className="flex flex-col border-t border-border/30">
        {members.map((m) => (
          <div key={m.user.id} className="flex items-center justify-between py-6 border-b border-border/50 group transition-all">
            <div className="flex items-center gap-6">
              <div className="h-12 w-12 flex items-center justify-center font-serif text-lg text-foreground/40 border border-border/50 bg-foreground/[0.02]">
                {(m.user.name || "").split(" ").map(n => n.charAt(0)).join("").slice(0, 2)}
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground font-sans leading-none">
                  <HoverInfo identifier={m.user.id} type="freelancer">
                    {m.user.name}
                  </HoverInfo>
                </p>
                <p className="text-xs text-muted-foreground font-sans">{m.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-xs font-semibold text-muted-foreground font-sans">
                {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
              </div>

              {currentUserRole === 'owner' && m.user.id !== currentUserId && !removalTargetIds.includes(m.user.id) && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 hover:text-foreground text-muted-foreground transition-colors outline-none">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border-border">
                    <DropdownMenuItem 
                      onClick={() => handleRemove(m.user.id)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/5 text-xs font-semibold cursor-pointer font-sans"
                    >
                      <UserMinus className="h-3.5 w-3.5 mr-2" />
                      Initiate removal
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
