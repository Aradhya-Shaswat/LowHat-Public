"use server";

import { db } from "@/lib/db";
import { milestones, projects } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendNotification } from "@/lib/notifications";
import { teamMembers } from "@/lib/db/schema";

async function verifyProjectAccess(projectId: string, userId: string) {
  const [project] = await db
    .select({ clientId: projects.clientId, teamId: projects.teamId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) return null;
  
  return project;
}

export async function createMilestoneAction(projectId: string, data: { title: string, dueDate?: string | null, assignedTo?: "team" | "client" }) {
  const session = await verifySession();
  if (!session?.isAuth) return { error: "Unauthorized" };

  const project = await verifyProjectAccess(projectId, session.userId);
  if (!project) return { error: "Project not found or access denied" };

  await db.insert(milestones).values({
    projectId,
    title: data.title,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    assignedTo: data.assignedTo ?? "team",
    status: "pending",
    amount: 0,
  });

  const assigneeType = data.assignedTo ?? "team";
  if (assigneeType === "team") {
    const members = await db.select({ userId: teamMembers.userId })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, project.teamId));
    for (const m of members) {
      await sendNotification({
        userId: m.userId,
        type: 'project',
        title: "New Deliverable Assigned",
        content: `Your unit has been assigned a new deliverable: ${data.title}`,
        actionUrl: `/projects/${projectId}`,
      });
    }
  } else {
    await sendNotification({
      userId: project.clientId,
      type: 'project',
      title: "New Deliverable Assigned",
      content: `You have been assigned a new deliverable: ${data.title}`,
      actionUrl: `/projects/${projectId}`,
    });
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateMilestoneAction(milestoneId: string, data: { title?: string, dueDate?: string | null, assignedTo?: "team" | "client", status?: "pending" | "in_progress" | "completed" }) {
  const session = await verifySession();
  if (!session?.isAuth) return { error: "Unauthorized" };

  const [milestone] = await db.select().from(milestones).where(eq(milestones.id, milestoneId)).limit(1);
  if (!milestone) return { error: "Milestone not found" };

  const project = await verifyProjectAccess(milestone.projectId, session.userId);
  if (!project) return { error: "Access denied" };

  await db.update(milestones).set({
    title: data.title !== undefined ? data.title : milestone.title,
    dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : milestone.dueDate,
    assignedTo: data.assignedTo !== undefined ? data.assignedTo : milestone.assignedTo,
    status: data.status !== undefined ? data.status : milestone.status,
    updatedAt: new Date(),
  }).where(eq(milestones.id, milestoneId));

  if (data.status === "completed" && milestone.status !== "completed") {
    if (milestone.assignedTo === "team") {
      await sendNotification({
        userId: project.clientId,
        type: 'project',
        title: "Deliverable Completed",
        content: `The unit has completed the deliverable: ${milestone.title}`,
        actionUrl: `/projects/${milestone.projectId}`,
      });
    } else {
      const members = await db.select({ userId: teamMembers.userId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, project.teamId));
      for (const m of members) {
        await sendNotification({
          userId: m.userId,
          type: 'project',
          title: "Deliverable Completed",
          content: `The client has completed the deliverable: ${milestone.title}`,
          actionUrl: `/projects/${milestone.projectId}`,
        });
      }
    }
  }

  revalidatePath(`/projects/${milestone.projectId}`);
  return { success: true };
}

export async function deleteMilestoneAction(milestoneId: string) {
  const session = await verifySession();
  if (!session?.isAuth) return { error: "Unauthorized" };

  const [milestone] = await db.select().from(milestones).where(eq(milestones.id, milestoneId)).limit(1);
  if (!milestone) return { error: "Milestone not found" };

  const project = await verifyProjectAccess(milestone.projectId, session.userId);
  if (!project) return { error: "Access denied" };

  await db.delete(milestones).where(eq(milestones.id, milestoneId));

  revalidatePath(`/projects/${milestone.projectId}`);
  return { success: true };
}
