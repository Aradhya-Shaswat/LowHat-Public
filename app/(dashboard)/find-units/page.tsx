import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { teams, teamMembers, joinRequests } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { submitJoinRequestAction } from "@/app/actions/units";
import { JoinUnitModal } from "@/components/join-unit-modal";
import { HoverInfo } from "@/components/hover-info";

export default async function FindUnitsPage() {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "freelancer") {
    redirect("/");
  }

  const userMembership = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, session.userId))
    .limit(1);

  const isInUnit = userMembership.length > 0;

  const myRequests = await db
    .select()
    .from(joinRequests)
    .where(eq(joinRequests.userId, session.userId));

  const availableUnits = await db
    .select()
    .from(teams)
    .where(eq(teams.state, 'active'))
    .limit(20);

  return (
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full">
      <header className="mb-8">
        <h1 className="text-4xl font-serif text-foreground mb-4">Discover Units</h1>
        <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
          Find and partner with established operational collectives. Browse by capabilities, reputation, and verification status.
        </p>
      </header>

      {isInUnit ? (
        <div className="py-4 border-b border-border/50 mb-8 flex items-center justify-between">
          <p className="text-sm text-muted-foreground font-sans">
            You are currently an active member of an execution unit. Membership is exclusive.
          </p>
          <a href="/my-unit" className="text-xs font-semibold text-foreground hover:opacity-80 transition-opacity font-sans">
            Manage my unit →
          </a>
        </div>
      ) : null}

      <div className="flex flex-col border-t border-border/30">
        {availableUnits.map((u) => {
          const myRequest = myRequests.find(r => r.teamId === u.id);
          const isPending = myRequest?.status === 'pending';
          const isRejected = myRequest?.status === 'rejected';
          
          let cooldownActive = false;
          let daysLeft = 0;
          if (isRejected && myRequest?.updatedAt) {
            const diff = (Date.now() - new Date(myRequest.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
            if (diff < 14) {
              cooldownActive = true;
              daysLeft = Math.ceil(14 - diff);
            }
          }

          return (
            <div key={u.id} className="py-10 border-b border-border/50 flex flex-col md:flex-row md:items-start md:justify-between gap-8 group">
              <div className="space-y-4 flex-1 max-w-2xl">
                <div className="flex items-center gap-6">
                  <h3 className="font-serif text-2xl text-foreground leading-none">
                    <HoverInfo identifier={u.id} type="unit">
                      {u.name}
                    </HoverInfo>
                  </h3>
                  {u.moderationStatus === 'approved' && (
                    <span className="text-[10px] font-medium text-emerald-600 tracking-wider uppercase font-sans border border-emerald-500/20 px-1.5 py-0.5">
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans max-w-xl">
                  {u.description || "No operational mandate provided."}
                </p>
              </div>
              
              <div className="flex-shrink-0 pt-1">
                {isInUnit ? (
                  <span className="text-[10px] font-medium text-muted-foreground/40 tracking-widest uppercase font-sans">
                    Exclusive Membership
                  </span>
                ) : isPending ? (
                  <span className="text-[10px] font-medium text-amber-600 tracking-widest uppercase font-sans border border-amber-500/20 px-3 py-1">
                    Request Pending
                  </span>
                ) : cooldownActive ? (
                  <span className="text-[10px] font-medium text-rose-600 tracking-widest uppercase font-sans border border-rose-500/20 px-3 py-1" title="14-day cooling period after rejection">
                    Cooling Period ({daysLeft}d)
                  </span>
                ) : (
                  <JoinUnitModal unitId={u.id} unitName={u.name} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
