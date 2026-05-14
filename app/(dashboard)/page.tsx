import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { jobs, users, clientProfiles, bids, teams, teamMembers } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

export default async function ExecutionBoardPage() {
  const session = await verifySession();
  const role = session?.role || "freelancer"; // Default to show general view if somehow bypassed layout
  
  // 1. Fetch Global Job Market
  const openJobs = await db.select({
    job: jobs,
    client: users,
    clientProfile: clientProfiles,
  })
  .from(jobs)
  .leftJoin(users, eq(jobs.clientId, users.id))
  .leftJoin(clientProfiles, eq(clientProfiles.userId, users.id))
  .where(inArray(jobs.status, ["open", "bidding"]))
  .orderBy(desc(jobs.createdAt));

  // 2. Count bids manually (simple version for MVP)
  const jobIds = openJobs.map((j) => j.job.id);
  let bidsData: { jobId: string; id: string }[] = [];
  if (jobIds.length > 0) {
    bidsData = await db.select({ jobId: bids.jobId, id: bids.id }).from(bids);
  }

  // 3. Right Sidebar context: Get freelancer's team
  let userTeam = null;
  if (role === "freelancer" && session) {
    const tm = await db.select({ team: teams })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, session.userId))
      .limit(1);
    if (tm.length > 0) {
      userTeam = tm[0].team;
    }
  }

  return (
    <div className="flex flex-col py-12 px-8 max-w-6xl mx-auto min-h-full">
      <main className="flex-1">
        <div className="flex flex-col md:flex-row gap-12 relative items-start">
          
          {/* Main Feed */}
          <div className="flex-1 space-y-8">
            <header className="flex items-center justify-between border-b border-border pb-8">
              <div>
                <h1 className="text-3xl font-heading text-foreground mb-2">Execution Board</h1>
                <p className="text-muted-foreground text-sm">Discover verified clients looking for high-quality execution units.</p>
              </div>
              {role === "client" && (
                <Link href="/my-jobs/new">
                  <Button className="rounded-md font-medium px-6 shadow-sm">Post a Job</Button>
                </Link>
              )}
            </header>

            <div className="space-y-6 pt-2">
              {openJobs.length === 0 ? (
                 <div className="text-center py-24 border border-dashed border-border rounded-xl bg-card/30">
                   <p className="text-sm text-muted-foreground">The execution board is currently quiet.</p>
                 </div>
              ) : openJobs.map((entry) => {
                const jobBids = bidsData.filter((b) => b.jobId === entry.job.id);
                return (
                  <Link key={entry.job.id} href={`/jobs/${entry.job.id}`} className="block group py-6 border-b border-border/60 hover:border-foreground/40 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                            {entry.job.status}
                          </span>
                          <span className="text-xs text-muted-foreground font-sans tracking-tight">
                            Budget: ${(entry.job.budgetMin! / 100).toLocaleString()} - ${(entry.job.budgetMax! / 100).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="text-2xl font-serif text-foreground group-hover:text-foreground/80 transition-colors">{entry.job.title}</h3>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed font-sans max-w-3xl">
                      {entry.job.description}
                    </p>
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground font-sans">{entry.clientProfile?.companyName || entry.client?.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground font-sans">{jobBids.length} bids</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar: Context or Team State */}
          <aside className="w-full md:w-[300px] space-y-6 sticky top-12">
            {role === "freelancer" ? (
              userTeam ? (
                <div className="px-6 py-8 rounded-xl border border-border bg-card/30">
                  <h4 className="font-serif text-lg mb-2 text-foreground">{userTeam.name}</h4>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{userTeam.description}</p>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Reputation</span>
                      <span className="font-medium text-foreground">5.0 / 5</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Available Capacity</span>
                      <span className="font-medium text-foreground text-primary">High</span>
                    </div>
                  </div>

                  <Link href="/team" className="block w-full mt-6">
                    <Button variant="outline" className="w-full bg-transparent text-foreground">Manage Unit</Button>
                  </Link>
                </div>
              ) : (
                <div className="px-6 py-8 rounded-xl border border-dashed border-border bg-card/10 text-center">
                  <h4 className="font-serif text-lg mb-2 text-foreground">Join a Team</h4>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">You must form or join an execution unit to bid on contracts.</p>
                  <Link href="/team" className="block w-full">
                    <Button className="w-full bg-foreground text-background hover:bg-foreground/90">Initialize Unit</Button>
                  </Link>
                </div>
              )
            ) : (
              <div className="px-6 py-8 rounded-xl border border-border bg-secondary/30">
                <h4 className="font-serif text-lg mb-2 text-foreground">Marketplace Intel</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The marketplace is active. Teams are responding to execution contracts within 24 hours on average.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
