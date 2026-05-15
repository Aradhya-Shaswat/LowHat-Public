import { db } from "@/lib/db";
import { jobs, users, clientProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

  return (
    <ClientJobView
      job={job}
      jobId={jobId}
      role={role}
      clientName={client?.profile?.companyName || client?.user?.name || "Unknown"}
    />
  );
}