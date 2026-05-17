"use server";

import { db } from "@/lib/db";
import { jobs, bids, teams, teamMembers, projects, messageThreads, notifications } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { eq, and, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendNotification } from "@/lib/notifications";
import { validateProfanity } from "@/lib/profanity";

export async function createJobAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "client") {
    return { error: "Unauthorized. Only clients can post jobs." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const budgetMin = parseInt(formData.get("budgetMin") as string, 10);
  const budgetMax = parseInt(formData.get("budgetMax") as string, 10);
  const workCategory = formData.get("workCategory") as string;
  const requiredSkills = formData.get("requiredSkills") as string;
  const experienceLevel = formData.get("experienceLevel") as string;
  const timeAllowed = formData.get("timeAllowed") as string;

  if (!title || !description || isNaN(budgetMin) || isNaN(budgetMax) || !workCategory || !requiredSkills || !experienceLevel || !timeAllowed) {
    return { error: "All fields are required and budgets must be valid numbers." };
  }

  const profanityError = validateProfanity(title, "title") || validateProfanity(description, "description");
  if (profanityError) {
    return { error: profanityError };
  }

  try {
    const [job] = await db.insert(jobs).values({
      clientId: session.userId,
      title,
      description,
      workCategory,
      requiredSkills,
      experienceLevel,
      timeAllowed,
      budgetMin: budgetMin * 100,
      budgetMax: budgetMax * 100,
      status: "open",
    }).returning();

    await sendNotification({
      userId: session.userId,
      type: "system",
      title: "Posting Created",
      content: `Your job posting "${title}" has been submitted for moderation.`,
      actionUrl: `/my-jobs/${job.id}`,
    });
  } catch (err) {
    return { error: "Failed to post job." };
  }

  redirect("/my-jobs");
}


export async function submitBidAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "freelancer") {
    return { error: "Unauthorized. Only freelancers can submit bids." };
  }

  const jobId = formData.get("jobId") as string;
  const amount = parseInt(formData.get("amount") as string, 10);
  const proposal = formData.get("proposal") as string;
  const estimatedDelivery = formData.get("estimatedDelivery") as string;
  const taskAssignments = formData.get("taskAssignments") as string;

  if (!jobId || isNaN(amount) || !proposal || !estimatedDelivery) {
    return { error: "All fields are required." };
  }

  const profanityError = validateProfanity(proposal, "proposal");
  if (profanityError) {
    return { error: profanityError };
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
      estimatedDelivery,
      taskAssignments,
      status: "pending",
    });

    await sendNotification({
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
      await sendNotification({
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
    .select({ id: projects.id, clientId: projects.clientId, teamId: projects.teamId })
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

  await sendNotification({
    userId: session.userId,
    type: "system",
    title: "Milestone Updated",
    content: `Milestone assignee has been updated to ${assignedTo}.`,
    actionUrl: `/projects/${project.id}`,
  });

  if (project.teamId) {
    const { teamMembers } = await import("@/lib/db/schema");
    const members = await db.select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eqOp(teamMembers.teamId, project.teamId));

    for (const member of members) {
      await sendNotification({
        userId: member.userId,
        type: "system",
        title: "Milestone Reassigned",
        content: `A milestone in your project has been reassigned to ${assignedTo}.`,
        actionUrl: `/projects/${project.id}`,
      });
    }
  }

  revalidatePath("/projects");
  return { success: true };
}

export async function deleteJobAction(formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "client") {
    return;
  }

  const jobId = formData.get("jobId") as string;
  if (!jobId) return;

  try {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job || job.clientId !== session.userId) {
      return;
    }

    const acceptedBids = await db.select({ id: bids.id })
      .from(bids)
      .where(and(eq(bids.jobId, jobId), eq(bids.status, "accepted")))
      .limit(1);
    
    if (acceptedBids.length > 0) {
      return;
    }

    await db.delete(jobs).where(eq(jobs.id, jobId));

    await sendNotification({
      userId: session.userId,
      type: "system",
      title: "Posting Deleted",
      content: `Your job posting "${job.title}" has been successfully deleted.`,
    });
  } catch (err) {
    console.error("Delete job error:", err);
  }

  redirect("/my-jobs");
}

export async function generateJobAIAssistAction(title: string) {
  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) {
    return { error: "OpenRouter API key not configured." };
  }

  const categories = [
    "Software & Tech",
    "Design & Art",
    "Video & Media",
    "Writing & Content",
    "Physical & Local",
    "General Execution"
  ];

  const experienceLevels = [
    "Entry/Junior",
    "Mid-Level",
    "Senior",
    "Expert/Lead"
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "liquid/lfm-2.5-1.2b-instruct:free",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant helping a client create a job posting. Based on the rough project title provided by the user, generate a highly detailed and professional job posting.
            
            Provide the following in your response:
            1. An improved, more professional and descriptive Project Title.
            2. A very detailed Description including scope, potential technical requirements, and acceptance criteria.
            3. Suggested required skills or tools as a comma-separated list.
            4. The most appropriate Work Category from this list ONLY: ${categories.join(", ")}.
            5. The most appropriate Experience Level from this list ONLY: ${experienceLevels.join(", ")}.
            6. A suggested Minimum Budget (integer in USD).
            7. A suggested Maximum Budget (integer in USD).
            
            Respond ONLY with a valid JSON object matching this structure:
            {
              "title": "...",
              "description": "...",
              "skills": "...",
              "category": "...",
              "experienceLevel": "...",
              "budgetMin": 5000,
              "budgetMax": 15000
            }
            Do not include any markdown formatting, backticks, or text before/after the JSON.`
          },
          {
            role: "user",
            content: `Rough Title: ${title}`
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error?.message || "Failed to generate content from OpenRouter." };
    }
    
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return { success: true, ...parsed };
    } catch (e) {
      return { 
        success: true, 
        description: content, 
        skills: "", 
        category: "",
        experienceLevel: "",
        budgetMin: 500,
        budgetMax: 2000,
        title: title
      };
    }
  } catch (error) {
    return { error: "Failed to connect to AI service." };
  }
}

export async function generateBidAIAssistAction(jobTitle: string, jobDescription: string) {
  const apiKey = process.env.OPENROUTER_KEY;
  if (!apiKey) {
    return { error: "OpenRouter API key not configured." };
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "liquid/lfm-2.5-1.2b-instruct:free",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant helping a freelancer create a bid proposal for a job posting. Based on the job title and description provided, generate a detailed and professional bid proposal.
            
            Provide the following in your response:
            1. A detailed Proposal (Implementation Plan) including execution strategy, approach, and deliverables.
            2. Suggested Estimated Delivery Time (e.g., "2 weeks", "1 month").
            
            Respond ONLY with a valid JSON object matching this structure:
            {
              "proposal": "...",
              "estimatedDelivery": "..."
            }
            Do not include any markdown formatting, backticks, or text before/after the JSON.`
          },
          {
            role: "user",
            content: `Job Title: ${jobTitle}\nJob Description: ${jobDescription}`
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error?.message || "Failed to generate content from OpenRouter." };
    }
    
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return { success: true, ...parsed };
    } catch (e) {
      return { 
        success: true, 
        proposal: content,
        estimatedDelivery: ""
      };
    }
  } catch (error) {
    return { error: "Failed to connect to AI service." };
  }
}

export async function getOpenJobsAction() {
  const session = await verifySession();
  if (!session?.isAuth) return [];

  const openJobs = await db.select()
    .from(jobs)
    .where(
      and(
        eq(jobs.moderationStatus, "approved"),
        inArray(jobs.status, ["open", "bidding"])
      )
    )
    .orderBy(desc(jobs.createdAt));

  return openJobs;
}

