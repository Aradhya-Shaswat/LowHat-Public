"use server";

import { db } from "@/lib/db";
import { jobs, bids, teams, teamMembers, projects, messageThreads } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

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
    const tm = await db.select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.userId))
      .limit(1);

    if (tm.length === 0) {
      return { error: "You must join a team to bid." };
    }

    await db.insert(bids).values({
      jobId,
      teamId: tm[0].teamId,
      amount: amount * 100,
      proposal,
      status: "pending",
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

  } catch (err) {

  }

  redirect("/projects");
}
