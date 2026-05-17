import { db } from "@/lib/db";
import { jobs, users, clientProfiles, teamMembers, bids } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import ClientJobView from "./client-job-view";

export default async function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const session = await verifySession();
  const role = session?.role || "client";

  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);

  if (!job) {
    return (
      <div className="flex flex-col py-12 px-8 max-w-4xl min-h-full">
        <div className="text-center py-12">Job not found.</div>
      </div>
    );
  }

  const isOwner = session?.userId === job.clientId;
  const isAdmin = session?.role === "admin";

  if (job.moderationStatus !== "approved" && !isOwner && !isAdmin) {
    return (
      <div className="flex flex-col py-12 px-8 max-w-4xl min-h-full">
        <div className="text-center py-12">
          <h2 className="text-xl font-serif mb-2">Review Pending</h2>
          <p className="text-muted-foreground text-sm">This contract is currently under moderation and is not yet public.</p>
        </div>
      </div>
    );
  }

  const [client] = await db.select({
    user: users,
    profile: clientProfiles,
  })
  .from(users)
  .leftJoin(clientProfiles, eq(clientProfiles.userId, users.id))
  .where(eq(users.id, job.clientId))
  .limit(1);

  let teamMembersList: { id: string; name: string }[] = [];
  let hasBidded = false;
  if (role === "freelancer" && session?.userId) {
    const [tm] = await db.select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.userId))
      .limit(1);
      
    if (tm) {
      const members = await db.select({
        id: users.id,
        name: users.name,
      })
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, tm.teamId));
      
      teamMembersList = members.map(m => ({ id: m.id || "Unknown", name: m.name || "Unknown" }));

      const [existingBid] = await db.select({ id: bids.id })
        .from(bids)
        .where(and(eq(bids.jobId, jobId), eq(bids.teamId, tm.teamId)))
        .limit(1);
        
      hasBidded = !!existingBid;
    }
  }

  return (
    <ClientJobView
      job={job}
      jobId={jobId}
      role={role}
      clientName={client?.profile?.companyName || client?.user?.name || "Unknown"}
      teamMembers={teamMembersList}
      hasBidded={hasBidded}
    />
  );
}