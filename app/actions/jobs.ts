"use server";

import { db } from "@/lib/db";
import { jobs, bids, teams, teamMembers, projects, messageThreads, notifications } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createJobAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "client") {
    return { error: "Unauthorized. Only clients can post jobs." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const budgetMin = parseInt(formData.get("budgetMin") as string, 10);
  const budgetMax = parseInt(formData.get("budgetMax") as string, 10);

  if (!title || !description || isNaN(budgetMin) || isNaN(budgetMax)) {
    return { error: "All fields are required and budgets must be valid numbers." };
  }

  try {
    await db.insert(jobs).values({
      clientId: session.userId,
      title,
      description,
      budgetMin: budgetMin * 100,
      budgetMax: budgetMax * 100,
      status: "open",
    });
  } catch (err) {
    return { error: "Failed to post job." };
  }

  redirect("/my-jobs");
}

export async function mockAIJobAssistantAction(description: string) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "client") {
    return { error: "Unauthorized" };
  }

  const optimizedDescription = `(AI Scoped) Expected deliverables:
- Architecture review
- Secure execution pipeline
- Testing guarantees

Original description base:
${description}`;

  return { optimizedDescription, suggestedMin: 5000, suggestedMax: 15000 };
}

export async function submitBidAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "freelancer") {
    return { error: "Unauthorized. Only freelancers can submit bids." };
  }

  const jobId = formData.get("jobId") as string;
  const amount = parseInt(formData.get("amount") as string, 10);
  const proposal = formData.get("proposal") as string;

  if (!jobId || isNaN(amount) || !proposal) {
    return { error: "All fields are required." };
  }

  try {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) return { error: "Job not found." };

    if (job.budgetMin && (amount * 100) < job.budgetMin) {
      return { error: `Bid amount must be at least $${(job.budgetMin / 100).toLocaleString()}.` };
    }

    const tm = await db.select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.userId))
      .limit(1);

    if (tm.length === 0) {
      return { error: "You must join a team to bid." };
    }

    const existingBid = await db.select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.jobId, jobId), eq(bids.teamId, tm[0].teamId)))
      .limit(1);

    if (existingBid.length > 0) {
      return { error: "Your team has already submitted a bid for this project." };
    }

    await db.insert(bids).values({
      jobId,
      teamId: tm[0].teamId,
      amount: amount * 100,
      proposal,
      status: "pending",
    });

    await db.insert(notifications).values({
      userId: job.clientId,
      type: "bid",
      title: "New Execution Bid",
      content: `A new bid of $${amount.toLocaleString()} has been submitted for "${job.title}".`,
      actionUrl: `/my-jobs/${jobId}`,
    });

  } catch (err) {
    return { error: "Failed to submit bid." };
  }

  redirect("/projects");
}

export async function acceptBidAction(formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "client") {
    return;
  }

  const bidId = formData.get("bidId") as string;
  const jobId = formData.get("jobId") as string;
  const teamId = formData.get("teamId") as string;

  if (!bidId || !jobId || !teamId) {
    return;
  }

  try {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job || job.clientId !== session.userId) {
      return;
    }

    await db.update(jobs)
      .set({ status: "in_progress" })
      .where(eq(jobs.id, jobId));

    await db.update(bids)
      .set({ status: "accepted" })
      .where(eq(bids.id, bidId));

    const [newProject] = await db.insert(projects).values({
      jobId,
      winningBidId: bidId,
      clientId: session.userId,
      teamId,
      status: "active",
    }).returning();

    await db.insert(messageThreads).values({
      projectId: newProject.id,
    });

    const members = await db.select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));

    for (const member of members) {
      await db.insert(notifications).values({
        userId: member.userId,
        type: "project",
        title: "Contract Awarded",
        content: `Your unit's bid for "${job.title}" has been accepted. Execution has begun.`,
        actionUrl: `/projects/${newProject.id}`,
      });
    }

  } catch (err) {
    console.error("Accept bid error:", err);
  }

  redirect("/projects");
}

export async function updateMilestoneAssigneeAction(
  milestoneId: string,
  assignedTo: "team" | "client"
): Promise<{ error?: string; success?: boolean }> {
  const session = await verifySession();
  if (!session?.isAuth) return { error: "Unauthorized" };

  const { milestones, projects } = await import("@/lib/db/schema");
  const { eq: eqOp } = await import("drizzle-orm");

  const [milestone] = await db
    .select({ id: milestones.id, projectId: milestones.projectId })
    .from(milestones)
    .where(eqOp(milestones.id, milestoneId))
    .limit(1);

  if (!milestone) return { error: "Milestone not found" };

  const [project] = await db
    .select({ clientId: projects.clientId, teamId: projects.teamId })
    .from(projects)
    .where(eqOp(projects.id, milestone.projectId))
    .limit(1);

  if (!project) return { error: "Project not found" };

  if (project.clientId !== session.userId) {
    return { error: "Only the client can reassign deliverables." };
  }

  await db
    .update(milestones)
    .set({ assignedTo, updatedAt: new Date() })
    .where(eqOp(milestones.id, milestoneId));

  revalidatePath("/projects");
  return { success: true };
}
