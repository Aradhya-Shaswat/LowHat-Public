import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { verifications, jobs, teams, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { moderateVerificationAction, moderateJobAction, moderateTeamAction } from "@/app/actions/admin";
import { ModerationCard } from "@/components/moderation-card";

export default async function AdminModerationPage() {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "admin") {
    redirect("/");
  }

  const pendingVerifications = await db.select()
    .from(verifications)
    .where(eq(verifications.status, "pending"))
    .orderBy(desc(verifications.createdAt));

  const pendingJobs = await db.select({
    job: jobs,
    client: users,
  })
    .from(jobs)
    .leftJoin(users, eq(jobs.clientId, users.id))
    .where(eq(jobs.moderationStatus, "pending"))
    .orderBy(desc(jobs.createdAt));

  const pendingTeams = await db.select()
    .from(teams)
    .where(eq(teams.moderationStatus, "pending"))
    .orderBy(desc(teams.createdAt));
  
  return (
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full">
      <header className="mb-12 border-b border-border pb-8">
        <h1 className="text-4xl font-heading text-foreground mb-3">Moderation</h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Review submissions for quality and trust. Every entry approved here becomes a public record on the LowHat execution board.
        </p>
      </header>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 mb-10">
          <TabsTrigger value="jobs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-4 text-xs font-semibold uppercase tracking-widest transition-all">
            Jobs ({pendingJobs.length})
          </TabsTrigger>
          <TabsTrigger value="teams" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-4 text-xs font-semibold uppercase tracking-widest transition-all">
            Units ({pendingTeams.length})
          </TabsTrigger>
          <TabsTrigger value="verifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-4 text-xs font-semibold uppercase tracking-widest transition-all">
            Identities ({pendingVerifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-0">
          {pendingJobs.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm text-muted-foreground italic font-serif">The job queue is clear.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {pendingJobs.map(({ job, client }) => (
                <ModerationCard 
                  key={job.id} 
                  type="job" 
                  data={job} 
                  client={client} 
                  action={moderateJobAction} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="teams" className="space-y-0">
          {pendingTeams.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm text-muted-foreground italic font-serif">All execution units have been processed.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {pendingTeams.map((team) => (
                <ModerationCard 
                  key={team.id} 
                  type="unit" 
                  data={team} 
                  action={moderateTeamAction} 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="verifications" className="space-y-0">
          {pendingVerifications.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm text-muted-foreground italic font-serif">No identity verifications pending.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {pendingVerifications.map((v) => (
                <ModerationCard 
                  key={v.id} 
                  type="identity" 
                  data={v} 
                  action={moderateVerificationAction} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
