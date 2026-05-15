import Link from "next/link";
import { db } from "@/lib/db";
import { jobs, bids } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { JobListItem } from "@/components/job-list-item";

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
          <h1 className="text-4xl font-heading text-foreground mb-3">Postings</h1>
          <p className="text-muted-foreground text-sm">Central board for your active execution contracts and unit bids.</p>
        </div>
        <Link href="/my-jobs/new" className="bg-foreground text-background text-[11px] font-bold uppercase tracking-widest px-8 py-3 rounded-sm hover:opacity-90 transition-opacity">
          Post a Job
        </Link>
      </header>

      {clientJobs.length === 0 ? (
        <div className="py-32 text-center">
          <h3 className="font-serif text-3xl text-foreground/30 italic mb-4">The board is empty.</h3>
          <Link href="/my-jobs/new" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground underline underline-offset-8 decoration-1 transition-colors">
            Initialize your first contract
          </Link>
        </div>
      ) : (
        <div className="flex flex-col">
          {clientJobs.map((job) => {
            const jobBidsCount = bidsData.filter((b) => b.jobId === job.id).length;
            return (
              <JobListItem 
                key={job.id} 
                job={job} 
                bidsCount={jobBidsCount} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
