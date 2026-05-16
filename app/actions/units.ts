"use server";

import { db } from "@/lib/db";
import { 
  teams, 
  teamMembers, 
  joinRequests, 
  unitAuditLogs, 
  removalRequests, 
  removalVotes, 
  ownershipTransfers,
  milestones,
  projects,
  disputes,
  notifications
} from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { eq, and, or, sql, count, desc, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type UnitActionResult = {
  success: boolean;
  message: string;
  data?: any;
} | null;


async function logAudit(teamId: string, actorId: string, action: string, details: any = {}, targetId?: string) {
  await db.insert(unitAuditLogs).values({
    teamId,
    actorUserId: actorId,
    action,
    targetUserId: targetId,
    details: JSON.stringify(details),
  });
}


async function checkBlockers(userId: string, teamId: string) {
  
  const activeMilestones = await db
    .select()
    .from(milestones)
    .innerJoin(projects, eq(milestones.projectId, projects.id))
    .where(and(
      eq(projects.teamId, teamId),
      eq(milestones.status, 'in_progress')
      
    ))
    .limit(1);

  if (activeMilestones.length > 0) return "User has active milestones assigned.";

  
  const activeDisputes = await db
    .select()
    .from(disputes)
    .innerJoin(projects, eq(disputes.projectId, projects.id))
    .where(and(
      eq(projects.teamId, teamId),
      eq(disputes.status, 'open')
    ))
    .limit(1);

  if (activeDisputes.length > 0) return "User is involved in an open dispute.";

  return null;
}


export async function createUnitAction(formData: FormData) {
  const session = await verifySession();
  if (!session || !session.isAuth || session.role !== "freelancer") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) throw new Error("Unit name is required.");

  try {
    const [newTeam] = await db.insert(teams)
      .values({ 
        name, 
        description,
        state: 'active',
        agreementsAcceptedAt: new Date(),
      })
      .returning();

    await db.insert(teamMembers)
      .values({
        teamId: newTeam.id,
        userId: session.userId,
        teamRole: "owner",
      });

    await logAudit(newTeam.id, session.userId, 'unit_created', { name });

    revalidatePath("/my-unit");
    return { success: true, message: "Unit initialized successfully." };
  } catch (err: any) {
    throw new Error("Failed to create unit: " + err.message);
  }
}


export async function submitJoinRequestAction(formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "freelancer") {
    return { success: false, message: "Unauthorized" };
  }

  const teamId = formData.get("teamId") as string;
  const message = formData.get("message") as string;
  const termsAccepted = formData.get("termsAccepted") === "on";

  if (!teamId) return { success: false, message: "Unit ID is required." };
  if (!termsAccepted) return { success: false, message: "You must accept the Unit Agreements." };

  
  const existingMembership = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, session.userId))
    .limit(1);

  if (existingMembership.length > 0) {
    return { success: false, message: "You are already a member of another unit." };
  }

  
  const pendingRequest = await db
    .select()
    .from(joinRequests)
    .where(and(
      eq(joinRequests.userId, session.userId),
      eq(joinRequests.teamId, teamId),
      eq(joinRequests.status, 'pending')
    ))
    .limit(1);

  if (pendingRequest.length > 0) {
    return { success: false, message: "You already have a pending request for this unit." };
  }

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); 

    await db.insert(joinRequests).values({
      teamId,
      userId: session.userId,
      message,
      termsAccepted: true,
      expiresAt,
    });

    await logAudit(teamId, session.userId, 'join_requested');

    revalidatePath("/find-units");
    return { success: true, message: "Request submitted. Awaiting approval." };
  } catch (err: any) {
    return { success: false, message: "Failed to submit request." };
  }
}


export async function approveJoinRequestAction(requestId: string) {
  const session = await verifySession();
  if (!session?.isAuth) return { success: false, message: "Unauthorized" };

  const [request] = await db
    .select()
    .from(joinRequests)
    .where(eq(joinRequests.id, requestId))
    .limit(1);

  if (!request || request.status !== 'pending') return { success: false, message: "Invalid request." };

  
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(
      eq(teamMembers.teamId, request.teamId),
      eq(teamMembers.userId, session.userId)
    ))
    .limit(1);

  if (!membership || (membership.teamRole !== 'owner' && membership.teamRole !== 'manager')) {
    return { success: false, message: "Insufficient permissions." };
  }

  try {
    await db.update(joinRequests)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(joinRequests.id, requestId));

    await db.insert(teamMembers).values({
      teamId: request.teamId,
      userId: request.userId,
      teamRole: 'member',
    });

    await logAudit(request.teamId, session.userId, 'join_approved', {}, request.userId);
    
    await db.insert(notifications).values({
      userId: request.userId,
      type: 'unit_governance',
      title: "Join Request Approved",
      content: `Your request to join the unit has been approved.`,
      actionUrl: "/my-unit",
    });

    revalidatePath("/my-unit");
    return { success: true, message: "Member approved." };
  } catch (err: any) {
    return { success: false, message: "Failed to approve member." };
  }
}


export async function initiateRemovalAction(targetUserId: string, teamId: string) {
  const session = await verifySession();
  if (!session?.isAuth) return { success: false, message: "Unauthorized" };

  
  const [ownerShip] = await db
    .select()
    .from(teamMembers)
    .where(and(
      eq(teamMembers.teamId, teamId),
      eq(teamMembers.userId, session.userId),
      eq(teamMembers.teamRole, 'owner')
    ))
    .limit(1);

  if (!ownerShip) return { success: false, message: "Only the owner can initiate removal." };
  if (targetUserId === session.userId) return { success: false, message: "Owner cannot be removed." };

  const existingRequest = await db
    .select()
    .from(removalRequests)
    .where(and(
      eq(removalRequests.teamId, teamId),
      eq(removalRequests.targetUserId, targetUserId),
      or(
        eq(removalRequests.status, 'pending'),
        eq(removalRequests.status, 'cooling')
      )
    ))
    .limit(1);

  if (existingRequest.length > 0) {
    return { success: false, message: "A removal process is already active for this member." };
  }

  const membersCountRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));
  
  const memberCount = Number(membersCountRes[0].count);

  try {
    if (memberCount <= 2) {
      
      const coolingEndsAt = new Date();
      coolingEndsAt.setHours(coolingEndsAt.getHours() + 24);

      const [request] = await db.insert(removalRequests).values({
        teamId,
        targetUserId,
        initiatorUserId: session.userId,
        status: 'cooling',
        coolingEndsAt,
      }).returning();

      await logAudit(teamId, session.userId, 'removal_initiated_auto', { targetUserId }, targetUserId);
    } else {
      
      await db.insert(removalRequests).values({
        teamId,
        targetUserId,
        initiatorUserId: session.userId,
        status: 'pending',
      });

      await logAudit(teamId, session.userId, 'removal_initiated_vote', { targetUserId }, targetUserId);
    }

    revalidatePath("/my-unit");
    return { success: true, message: "Removal process initiated." };
  } catch (err: any) {
    console.error("Removal initiation error:", err);
    return { success: false, message: `Failed to initiate removal: ${err.message || "Unknown error"}` };
  }
}


export async function voteRemovalAction(removalRequestId: string, vote: 'approve' | 'reject') {
  const session = await verifySession();
  if (!session?.isAuth) return { success: false, message: "Unauthorized" };

  const [request] = await db
    .select()
    .from(removalRequests)
    .where(eq(removalRequests.id, removalRequestId))
    .limit(1);

  if (!request || request.status !== 'pending') return { success: false, message: "Invalid request." };
  if (request.targetUserId === session.userId) return { success: false, message: "Target member cannot vote." };

  
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(
      eq(teamMembers.teamId, request.teamId),
      eq(teamMembers.userId, session.userId)
    ))
    .limit(1);

  if (!membership) return { success: false, message: "Not a member." };

  try {
    const existingVote = await db
      .select()
      .from(removalVotes)
      .where(and(
        eq(removalVotes.removalRequestId, removalRequestId),
        eq(removalVotes.voterUserId, session.userId)
      ))
      .limit(1);

    if (existingVote.length > 0) throw new Error("Already voted.");

    await db.insert(removalVotes).values({
      removalRequestId,
      voterUserId: session.userId,
      vote,
    });

    const membersRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, request.teamId));
    
    const totalEligibleVoters = Number(membersRes[0].count) - 1; 
    const threshold = Math.ceil(0.7 * totalEligibleVoters);

    const approvesRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(removalVotes)
      .where(and(
        eq(removalVotes.removalRequestId, removalRequestId),
        eq(removalVotes.vote, 'approve')
      ));
    
    const approves = Number(approvesRes[0].count);

    if (approves >= threshold) {
      const coolingEndsAt = new Date();
      coolingEndsAt.setHours(coolingEndsAt.getHours() + 24);

      await db.update(removalRequests)
        .set({ status: 'cooling', coolingEndsAt, updatedAt: new Date() })
        .where(eq(removalRequests.id, removalRequestId));

      await logAudit(request.teamId, "SYSTEM", 'removal_cooling_started', { requestId: removalRequestId }, request.targetUserId);
    }

    revalidatePath("/my-unit");
    return { success: true, message: "Vote cast." };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to vote." };
  }
}


export async function leaveUnitAction() {
  const session = await verifySession();
  if (!session?.isAuth) return { success: false, message: "Unauthorized" };

  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, session.userId))
    .limit(1);

  if (!membership) return { success: false, message: "Not in a unit." };
  if (membership.teamRole === 'owner') return { success: false, message: "Owner cannot leave. Dissolve the unit instead." };

  const blocker = await checkBlockers(session.userId, membership.teamId);
  if (blocker) return { success: false, message: blocker };

  try {
    await db.delete(teamMembers).where(eq(teamMembers.id, membership.id));
    await logAudit(membership.teamId, session.userId, 'member_left');

    revalidatePath("/my-unit");
    return { success: true, message: "You have left the unit." };
  } catch (err: any) {
    return { success: false, message: "Failed to leave unit." };
  }
}


export async function completeTransferAction(transferId: string) {
  const session = await verifySession();
  if (!session?.isAuth) return { success: false, message: "Unauthorized" };

  const [transfer] = await db
    .select()
    .from(ownershipTransfers)
    .where(eq(ownershipTransfers.id, transferId))
    .limit(1);

  if (!transfer) return { success: false, message: "Invalid transfer." };

  
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(
      eq(teamMembers.teamId, transfer.teamId),
      eq(teamMembers.userId, session.userId)
    ))
    .limit(1);

  if (!membership || (membership.teamRole !== 'owner' && session.userId !== transfer.toUserId)) {
    return { success: false, message: "Unauthorized." };
  }

  await db.update(ownershipTransfers)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(ownershipTransfers.id, transferId));

  revalidatePath("/my-unit");
  return { success: true, message: "Transfer completed." };
}


export async function updateUnitAction(
  _prevState: UnitActionResult,
  formData: FormData
): Promise<UnitActionResult> {
  const session = await verifySession();
  if (!session?.isAuth) return { success: false, message: "Unauthorized" };

  const teamId = formData.get("teamId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!teamId || !name) return { success: false, message: "Unit name is required." };

  
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(
      eq(teamMembers.teamId, teamId),
      eq(teamMembers.userId, session.userId)
    ))
    .limit(1);

  if (!membership || (membership.teamRole !== 'owner' && membership.teamRole !== 'manager')) {
    return { success: false, message: "Insufficient permissions." };
  }

  try {
    await db.update(teams)
      .set({ name, description, updatedAt: new Date() })
      .where(eq(teams.id, teamId));

    await logAudit(teamId, session.userId, 'unit_updated', { name });

    revalidatePath("/my-unit");
    return { success: true, message: "Unit details updated." };
  } catch (err: any) {
    return { success: false, message: "Failed to update unit." };
  }
}
