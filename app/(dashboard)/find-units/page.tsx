import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { eq, and, notExists } from "drizzle-orm";
import { redirect } from "next/navigation";
import { submitJoinRequestAction } from "@/app/actions/units";
import { JoinUnitModal } from "@/components/join-unit-modal";

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

  
  const availableUnits = await db
    .select()
    .from(teams)
    .where(eq(teams.state, 'active'))
    .limit(20);

  return (
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full max-w-6xl mx-auto">
      <header className="mb-16">
        <h1 className="text-4xl font-serif text-foreground mb-4">Discover Units</h1>
        <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
          Find and partner with established operational collectives. Browse by capabilities, reputation, and verification status.
        </p>
      </header>

      {isInUnit ? (
        <div className="p-6 rounded-2xl bg-secondary/20 border border-border/50 mb-12 flex items-center justify-between">
          <p className="text-sm text-muted-foreground italic">
            You are currently an active member of an execution unit. Membership is exclusive.
          </p>
          <a href="/my-unit" className="text-xs font-bold uppercase tracking-widest text-foreground hover:underline">
            Manage My Unit →
          </a>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableUnits.map((u) => (
          <div key={u.id} className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm flex flex-col justify-between group hover:border-foreground/10 transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg text-foreground">{u.name}</h3>
                {u.moderationStatus === 'approved' && (
                  <span className="text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded uppercase tracking-wider">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {u.description || "No operational mandate provided."}
              </p>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border/30">
              {isInUnit ? (
                <button disabled className="w-full py-2 border border-border rounded-lg text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 cursor-not-allowed">
                  Exclusive Membership
                </button>
              ) : (
                <JoinUnitModal unitId={u.id} unitName={u.name} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
