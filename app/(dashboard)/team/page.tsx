import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { teams, teamMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createTeamAction } from "@/app/actions/team";

export default async function TeamManagementPage() {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "freelancer") {
    redirect("/");
  }

  const tm = await db.select({
    team: teams,
  })
  .from(teamMembers)
  .leftJoin(teams, eq(teamMembers.teamId, teams.id))
  .where(eq(teamMembers.userId, session.userId))
  .limit(1);

  const team = tm.length > 0 ? tm[0].team : null;

  let membersList: { user: typeof users.$inferSelect, teamRole: string }[] = [];
  if (team) {
    const rawMembers = await db.select({
      user: users,
      mapping: teamMembers,
    })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, team.id));

    membersList = rawMembers.map((m) => ({
      user: m.user!,
      teamRole: m.mapping.teamRole,
    }));
  }

  return (
    <div className="flex flex-col py-12 px-8 max-w-4xl min-h-full">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-heading text-foreground mb-2">Team Management</h1>
        <p className="text-muted-foreground text-sm">Manage your execution unit, roles, and verifications.</p>
      </header>

      {!team ? (
        <div className="border border-border p-8 rounded-xl bg-card">
          <h2 className="text-xl font-serif text-foreground mb-4">Initialize an Execution Unit</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xl leading-relaxed">
            Freelancers cannot bid solo. You must form a micro-agency unit to pool your reputation and execute on contracts.
          </p>
          <form action={createTeamAction} className="space-y-4 max-w-md">
            <div>
              <label className="text-xs font-medium text-foreground uppercase tracking-wider mb-2 block">Unit Name</label>
              <input name="name" type="text" placeholder="e.g. Acme Backend Ops" required className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground uppercase tracking-wider mb-2 block">Description</label>
              <textarea name="description" placeholder="Describe your capabilities..." className="w-full px-3 py-2 bg-transparent border border-border rounded-md text-sm outline-none focus:border-foreground/30 h-24 resize-y"></textarea>
            </div>
            <Button type="submit" className="bg-foreground text-background w-full">Create Unit</Button>
          </form>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="border border-border p-8 rounded-xl bg-card relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8">
               <span className="bg-primary/10 text-primary text-xs px-3 py-1 font-semibold uppercase tracking-widest rounded-full border border-primary/20">Verified</span>
             </div>
             <h2 className="text-2xl font-serif text-foreground mb-2">{team.name}</h2>
             <p className="text-sm text-muted-foreground">{team.description}</p>
          </div>

          <div>
             <h3 className="text-lg font-serif text-foreground mb-4">Unit Members ({membersList.length})</h3>
             <div className="border border-border rounded-xl bg-card overflow-hidden">
               {membersList.map((m) => (
                 <div key={m.user.id} className="flex items-center justify-between p-4 border-b border-border last:border-b-0">
                   <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-serif text-lg">
                        {(m.user.name || "").split(" ").map(n => n.charAt(0)).join("").slice(0,2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.user.name}</p>
                        <p className="text-xs text-muted-foreground">{m.user.email}</p>
                     </div>
                   </div>
                   <div className="text-sm text-muted-foreground capitalize font-medium px-3 py-1 bg-secondary/50 rounded-md">
                     {m.teamRole}
                   </div>
                 </div>
               ))}
             </div>
             
          </div>
        </div>
      )}
    </div>
  );
}