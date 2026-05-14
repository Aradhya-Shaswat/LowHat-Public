import Link from "next/link";
import { db } from "@/lib/db";
import { jobs, bids, teams } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ArrowLeft, Shield, Sparkles } from "lucide-react";
import { acceptBidAction } from "@/app/actions/jobs";

export default async function JobDetailView({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "client") {
    redirect("/");
  }

  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job || job.clientId !== session.userId) {
    redirect("/my-jobs");
  }

  const jobBids = await db.select({
    bid: bids,
    team: teams,
  })
  .from(bids)
  .leftJoin(teams, eq(bids.teamId, teams.id))
  .where(eq(bids.jobId, job.id))
  .orderBy(desc(bids.createdAt));

  return (
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full">
      <div className="mb-10 border-b border-border pb-8">
        <Link href="/my-jobs" className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Postings
        </Link>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wider font-sans ${job.status === "open" ? "text-primary" : "text-muted-foreground"}`}>
            {job.status.replace("_", " ")}
          </span>
          <span className="text-xs text-muted-foreground font-sans tracking-tight">
            Budget: ${(job.budgetMin! / 100).toLocaleString()} - ${(job.budgetMax! / 100).toLocaleString()}
          </span>
        </div>
        <h1 className="text-3xl font-heading text-foreground mb-4">{job.title}</h1>
        <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
          {job.description}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xl font-serif text-foreground">Submitted Bids ({jobBids.length})</h2>
          {jobBids.length > 1 && (
            <div className="flex items-center text-xs font-medium text-secondary-foreground bg-secondary/40 px-3 py-1.5 rounded-md border border-secondary">
              <Sparkles className="w-3.5 h-3.5 mr-2" /> AI Summary Available
            </div>
          )}
        </div>

        {jobBids.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">No execution units have submitted bids yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0 max-w-4xl">
            {jobBids.map((entry) => (
              <div key={entry.bid.id} className="py-8 border-b border-border last:border-b-0">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-serif text-foreground flex items-center gap-2">
                      {entry.team?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Bid Amount: <span className="font-medium text-foreground">${(entry.bid.amount / 100).toLocaleString()}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="inline-flex items-center justify-center rounded-lg font-medium transition-all outline-none select-none border border-border hover:bg-secondary/50 px-4 h-8 text-xs text-muted-foreground hover:text-foreground">Message Unit</button>
                    {entry.bid.status === "accepted" ? (
                      <span className="inline-flex items-center justify-center rounded-lg font-medium transition-all px-4 h-8 text-xs bg-primary/10 text-primary border border-primary/20">Bid Accepted</span>
                    ) : job.status === "open" ? (
                      <form action={acceptBidAction}>
                        <input type="hidden" name="bidId" value={entry.bid.id} />
                        <input type="hidden" name="jobId" value={job.id} />
                        <input type="hidden" name="teamId" value={entry.team?.id} />
                        <button type="submit" className="inline-flex items-center justify-center rounded-lg font-medium transition-all outline-none select-none bg-foreground text-background hover:bg-foreground/90 px-4 h-8 text-xs">Accept Bid</button>
                      </form>
                    ) : null}
                  </div>
                </div>

                <div className="bg-background border border-border/50 p-4 rounded-md mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Execution Proposal</h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {entry.bid.proposal}
                  </p>
                </div>

                {jobBids.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-border/50 flex gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                      <strong className="text-foreground font-medium">AI Comparison:</strong> {entry.team?.name} offers a higher technical focus but is priced nearer the max budget. Their past metrics indicate faster delivery limits.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
