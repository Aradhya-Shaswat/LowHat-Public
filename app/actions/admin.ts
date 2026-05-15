"use server";

import { db } from "@/lib/db";
import { verifications, jobs, teams, notifications, teamMembers } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function moderateVerificationAction(formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "admin") {
    return;
  }

  const verificationId = formData.get("verificationId") as string;
  const status = formData.get("status") as "approved" | "rejected";

  if (!verificationId || !status) {
    return;
  }

  try {
    await db.update(verifications)
      .set({ status, updatedAt: new Date() })
      .where(eq(verifications.id, verificationId));
  } catch (err) {}

  revalidatePath("/admin/moderation");
}

export async function moderateJobAction(formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "admin") return;

  const jobId = formData.get("jobId") as string;
  const status = formData.get("status") as any;
  const reason = formData.get("reason") as string;

  if (!jobId || !status) return;

  try {
    const [job] = await db.update(jobs)
      .set({ 
        moderationStatus: status, 
        moderationReason: reason,
        updatedAt: new Date() 
      })
      .where(eq(jobs.id, jobId))
      .returning();

    if (job) {
      await db.insert(notifications).values({
        userId: job.clientId,
        type: "job",
        title: status === "approved" ? "Job Approved" : "Job Rejected",
        content: status === "approved" 
          ? `Your job "${job.title}" has been approved and is now public.`
          : `Your job "${job.title}" was rejected. ${reason || ""}`,
        actionUrl: `/my-jobs/${job.id}`,
      });
    }
  } catch (err) {}

  revalidatePath("/admin/moderation");
  revalidatePath("/");
}

export async function moderateTeamAction(formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "admin") return;

  const teamId = formData.get("teamId") as string;
  const status = formData.get("status") as any;
  const reason = formData.get("reason") as string;

  if (!teamId || !status) return;

  try {
    const [team] = await db.update(teams)
      .set({ 
        moderationStatus: status, 
        moderationReason: reason,
        updatedAt: new Date() 
      })
      .where(eq(teams.id, teamId))
      .returning();

    if (team) {
      const [owner] = await db.select()
        .from(teamMembers)
        .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.teamRole, "owner")))
        .limit(1);

      if (owner) {
        await db.insert(notifications).values({
          userId: owner.userId,
          type: "system",
          title: status === "approved" ? "Unit Verified" : "Unit Moderation Update",
          content: status === "approved"
            ? `Your unit "${team.name}" has been verified. You now have a verified badge.`
            : `Your unit "${team.name}" status updated to ${status}. ${reason || ""}`,
          actionUrl: "/team",
        });
      }
    }
  } catch (err) {}

  revalidatePath("/admin/moderation");
  revalidatePath("/team");
}
