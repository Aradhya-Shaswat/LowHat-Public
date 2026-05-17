import Link from "next/link";
import { db } from "@/lib/db";
import { jobs, bids, teams } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";
import { acceptBidAction, deleteJobAction } from "@/app/actions/jobs";
import { DeleteJobButton } from "@/components/delete-job-button";
import { HoverInfo } from "@/components/hover-info";

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

  const hasAcceptedBid = jobBids.some(b => b.bid.status === "accepted");

  return (
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full">
      <div className="mb-10 border-b border-border pb-8">
        <Link href="/my-jobs" className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Postings
        </Link>
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider font-sans block ${job.status === "open" ? "text-emerald-600" : "text-muted-foreground"}`}>
                {job.status.replace("_", " ")}
              </span>
              {job.moderationStatus !== "approved" && (
                <div className="flex items-center gap-3 text-[10px] font-bold tracking-tight">
                  <span className="text-muted-foreground">/</span>
                  <span className={`uppercase tracking-widest ${
                    job.moderationStatus === "pending" ? "text-amber-600" : "text-rose-600"
                  }`}>
                    {job.moderationStatus === "pending" ? "Awaiting Review" : `Moderation: ${job.moderationStatus}`}
                  </span>
                </div>
              )}
            </div>
            <h1 className="text-4xl font-heading text-foreground mb-4">{job.title}</h1>
          </div>
          <div className="text-right pt-2 flex flex-col items-end gap-2">
            <span className="text-sm font-medium text-foreground font-sans tracking-tight">
              ${(job.budgetMin! / 100).toLocaleString()} – ${(job.budgetMax! / 100).toLocaleString()}
            </span>
            {!hasAcceptedBid && (
              <form action={deleteJobAction}>
                <input type="hidden" name="jobId" value={job.id} />
                <DeleteJobButton />
              </form>
            )}
          </div>
        </div>
        
        {job.moderationStatus === "rejected" && job.moderationReason && (
          <div className="mb-10 py-1">
            <p className="text-sm font-sans text-rose-600 leading-relaxed">
              {job.moderationReason}
            </p>
          </div>
        )}

        <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
          {job.description}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xl font-serif text-foreground">Submitted Bids ({jobBids.length})</h2>
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
                      <HoverInfo identifier={entry.team?.id || ""} type="unit">
                        {entry.team?.name}
                      </HoverInfo>
                      {entry.team?.moderationStatus === "approved" && (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20" title="Verified Unit">
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Bid Amount: <span className="font-medium text-foreground">${(entry.bid.amount / 100).toLocaleString()}</span></p>
                  </div>
                  <div className="flex gap-2">
                    {entry.bid.status === "accepted" ? (
                      <span className="inline-flex items-center justify-center font-bold uppercase tracking-widest px-4 h-7 text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-sm">
                        Accepted Proposal
                      </span>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
