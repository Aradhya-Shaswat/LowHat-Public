import Link from "next/link";
import { Button } from "@/components/ui/button";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { jobs, users, clientProfiles, bids, teams, teamMembers } from "@/lib/db/schema";
import { eq, desc, inArray, and } from "drizzle-orm";

export default async function ExecutionBoardPage() {
  const session = await verifySession();
  const role = session?.role || "freelancer";
  
  const openJobs = await db.select({
    job: jobs,
    client: users,
    clientProfile: clientProfiles,
  })
  .from(jobs)
  .leftJoin(users, eq(jobs.clientId, users.id))
  .leftJoin(clientProfiles, eq(clientProfiles.userId, users.id))
  .where(
    and(
      inArray(jobs.status, ["open", "bidding"]),
      eq(jobs.moderationStatus, "approved")
    )
  )
  .orderBy(desc(jobs.createdAt));

  const jobIds = openJobs.map((j) => j.job.id);
  let bidsData: { jobId: string; id: string }[] = [];
  if (jobIds.length > 0) {
    bidsData = await db.select({ jobId: bids.jobId, id: bids.id })
      .from(bids)
      .where(inArray(bids.jobId, jobIds));
  }

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
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full">
      <main className="flex-1">
        <div className="flex flex-col md:flex-row gap-12 relative items-start">
          
          <div className="flex-1 space-y-8">
            <header className="flex items-center justify-between border-b border-border pb-10">
              <div>
                <h1 className="text-4xl font-serif text-foreground mb-3">
                  {role === "client" ? "Marketplace" : "Execution Board"}
                </h1>
                <p className="text-muted-foreground text-sm font-sans max-w-md leading-relaxed">
                  {role === "client"
                    ? "Browse and manage your open contracts."
                    : "Discover verified clients looking for high-quality execution units."}
                </p>
              </div>
              {role === "client" && (
                <Link href="/my-jobs/new">
                  <button className="text-xs font-semibold px-6 py-2 bg-foreground text-background hover:opacity-90 transition-opacity font-sans">Post a Job</button>
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
                      <span className="text-xs font-medium text-muted-foreground font-sans block mb-1">
                        {entry.job.status.charAt(0).toUpperCase() + entry.job.status.slice(1)}
                      </span>
                      <h3 className="text-2xl font-serif text-foreground group-hover:text-foreground/80 transition-colors">{entry.job.title}</h3>
                    </div>
                      <div className="text-right pt-1">
                        <span className="text-sm font-medium text-foreground font-sans tracking-tight">
                          ${(entry.job.budgetMin! / 100).toLocaleString()} – ${(entry.job.budgetMax! / 100).toLocaleString()}
                        </span>
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

        </div>
      </main>
    </div>
  );
}
