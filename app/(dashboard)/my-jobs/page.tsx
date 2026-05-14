import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { jobs, bids } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function MyJobsPage() {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "client") {
    redirect("/");
  }

  const clientJobs = await db.select()
    .from(jobs)
    .where(eq(jobs.clientId, session.userId))
    .orderBy(desc(jobs.createdAt));

  const jobIds = clientJobs.map((j) => j.id);
  let bidsData: { jobId: string; id: string }[] = [];
  if (jobIds.length > 0) {
    bidsData = await db.select({ jobId: bids.jobId, id: bids.id }).from(bids);
  }

  return (
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full">
      <header className="flex items-center justify-between border-b border-border pb-8 mb-8">
        <div>
          <h1 className="text-3xl font-heading text-foreground mb-2">My Postings</h1>
          <p className="text-muted-foreground text-sm">Manage your open jobs and compare team bids.</p>
        </div>
        <Link href="/my-jobs/new">
          <Button className="rounded-md font-medium px-6 shadow-sm">Post a Job</Button>
        </Link>
      </header>

      {clientJobs.length === 0 ? (
        <div className="text-center py-24">
          <h3 className="font-serif text-lg text-foreground mb-2">No Active Postings</h3>
          <p className="text-sm text-muted-foreground mb-6">You haven't posted any jobs to the execution board yet.</p>
          <Link href="/my-jobs/new">
            <Button variant="outline">Create your first job</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {clientJobs.map((job) => {
            const jobBids = bidsData.filter((b) => b.jobId === job.id);
            return (
              <Link key={job.id} href={`/my-jobs/${job.id}`} className="block group py-6 border-b border-border/60 hover:border-foreground/40 transition-colors">
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider font-sans ${job.status === "open" ? "text-primary" : "text-muted-foreground"}`}>
                      {job.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground font-sans tracking-tight">
                      Budget: ${(job.budgetMin! / 100).toLocaleString()} - ${(job.budgetMax! / 100).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif text-foreground group-hover:text-foreground/80 transition-colors">{job.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed font-sans max-w-3xl">{job.description}</p>
                <div className="flex items-center justify-between mt-6">
                  <span className="text-sm font-medium text-foreground font-sans">You</span>
                  <span className="text-sm font-medium text-foreground font-sans">{jobBids.length} bids</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
