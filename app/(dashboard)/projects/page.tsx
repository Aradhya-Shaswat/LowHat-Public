import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { projects, jobs, teams, teamMembers } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { HoverInfo } from "@/components/hover-info";

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
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full">
      <header className="flex items-center justify-between border-b border-border pb-6 mb-4">
        <div>
          <h1 className="text-4xl font-serif text-foreground mb-3">Active Projects</h1>
          <p className="text-muted-foreground text-sm font-sans leading-relaxed">Execution phases currently underway.</p>
        </div>
      </header>

      {userProjects.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-xl bg-card/30">
          <p className="text-sm text-muted-foreground mb-6">No active executions at the moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {userProjects.map((entry) => (
            <Link key={entry.project.id} href={`/projects/${entry.project.id}`} className="block group border-b border-border py-6 hover:border-foreground/20 transition-all">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium font-sans ${entry.project.status === "active" ? "text-primary" : "text-muted-foreground"}`}>
                      {entry.project.status.charAt(0).toUpperCase() + entry.project.status.slice(1)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif text-foreground group-hover:text-foreground/80 transition-colors">{entry.job.title}</h3>
                  <p className="text-sm text-muted-foreground font-sans">
                    Execution unit:{" "}
                    <HoverInfo identifier={entry.team.id} type="unit" className="font-semibold text-foreground">
                      {entry.team.name}
                    </HoverInfo>
                  </p>
                </div>
                <div className="shrink-0 pt-1 flex items-center text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors font-sans">
                  Open workspace <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}