import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ClientJobView from "./client-job-view";

export default async function JobPage({ params }: { params: { jobId: string } }) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, params.jobId)).limit(1);

  if (!job) {
    return (
      <div className="flex flex-col py-12 px-8 max-w-4xl min-h-full">
        <div className="text-center py-12">Job not found.</div>
      </div>
    );
  }

  return <ClientJobView job={job} jobId={params.jobId} />;
}