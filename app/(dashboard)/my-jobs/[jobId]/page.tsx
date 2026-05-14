import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { jobs, bids, teams, teamMembers, freelancerProfiles, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle, Shield, Sparkles } from "lucide-react";

export default async function JobDetailView({ params }: { params: { jobId: string } }) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "client") {
    redirect("/");
  }

  // Fetch Job
  const [job] = await db.select().from(jobs).where(eq(jobs.id, params.jobId)).limit(1);
  if (!job || job.clientId !== session.userId) {
    redirect("/my-jobs");
  }

  // Fetch Bids with Team info
  const jobBids = await db.select({
    bid: bids,
    team: teams,
  })
  .from(bids)
  .leftJoin(teams, eq(bids.teamId, teams.id))
  .where(eq(bids.jobId, job.id))
  .orderBy(desc(bids.createdAt));

  return (
    <div className="flex flex-col py-12 px-8 max-w-6xl mx-auto min-h-full">
      <div className="mb-10">
        <Link href="/my-jobs" className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to postings
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs font-semibold uppercase tracking-wider font-sans ${job.status === "open" ? "text-primary" : "text-muted-foreground"}`}>
                {job.status.replace("_", " ")}
              </span>
              <span className="text-xs text-muted-foreground font-sans tracking-tight">
                Budget: ${(job.budgetMin! / 100).toLocaleString()} - ${(job.budgetMax! / 100).toLocaleString()}
              </span>
            </div>
            <h1 className="text-3xl font-heading text-foreground mb-4">{job.title}</h1>
            <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed bg-card border border-border p-4 rounded-md">
              {job.description}
            </p>
          </div>
          {job.status === "bidding" || job.status === "open" ? (
             <Button variant="outline" className="opacity-50 cursor-not-allowed">Hiring in Progress</Button>
          ) : null}
        </div>
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
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card/30">
            <p className="text-sm text-muted-foreground">No execution units have submitted bids yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {jobBids.map((entry) => (
              <div key={entry.bid.id} className="p-6 border border-border rounded-xl bg-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-serif text-foreground flex items-center gap-2">
                      {entry.team?.name}
                      <Shield className="w-4 h-4 text-primary" /> 
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Bid Amount: <span className="font-medium text-foreground">${(entry.bid.amount / 100).toLocaleString()}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Message Unit</Button>
                    <Button className="bg-foreground text-background hover:bg-foreground/90 size-sm">Accept Bid</Button>
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
