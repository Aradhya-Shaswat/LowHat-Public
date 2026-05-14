import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { projects, jobs, teams, teamMembers } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await verifySession();
  if (!session?.isAuth) {
    redirect("/login");
  }

  let userProjects: { project: typeof projects.$inferSelect; job: typeof jobs.$inferSelect; team: typeof teams.$inferSelect }[] = [];

  if (session.role === "client") {
    userProjects = await db.select({
      project: projects,
      job: jobs,
      team: teams,
    })
    .from(projects)
    .innerJoin(jobs, eq(projects.jobId, jobs.id))
    .innerJoin(teams, eq(projects.teamId, teams.id))
    .where(eq(projects.clientId, session.userId))
    .orderBy(desc(projects.createdAt));
  } else if (session.role === "freelancer") {
    const tms = await db.select({ teamId: teamMembers.teamId }).from(teamMembers).where(eq(teamMembers.userId, session.userId));
    const teamIds = tms.map(t => t.teamId);

    if (teamIds.length > 0) {
      userProjects = await db.select({
        project: projects,
        job: jobs,
        team: teams,
      })
      .from(projects)
      .innerJoin(jobs, eq(projects.jobId, jobs.id))
      .innerJoin(teams, eq(projects.teamId, teams.id))
      .where(inArray(projects.teamId, teamIds))
      .orderBy(desc(projects.createdAt));
    }
  }

  return (
    <div className="flex flex-col py-12 px-8 max-w-5xl min-h-full">
      <header className="flex items-center justify-between border-b border-border pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-heading text-foreground mb-2">Active Projects</h1>
          <p className="text-muted-foreground text-sm">Execution phases currently underway.</p>
        </div>
      </header>

      {userProjects.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-xl bg-card/30">
          <p className="text-sm text-muted-foreground mb-6">No active executions at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {userProjects.map((entry) => (
            <Link key={entry.project.id} href={`/projects/${entry.project.id}`} className="block group">
              <div className="p-6 border border-border rounded-xl bg-card hover:border-foreground/20 transition-colors h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-semibold uppercase tracking-wider font-sans ${entry.project.status === "active" ? "text-primary" : "text-muted-foreground"}`}>
                      {entry.project.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-serif text-foreground mb-2 group-hover:text-foreground/80">{entry.job.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6">Execution Unit: <span className="font-medium text-foreground">{entry.team.name}</span></p>
                </div>
                <Button variant="outline" className="w-full bg-transparent group-hover:bg-foreground/5">Open Workspace</Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}