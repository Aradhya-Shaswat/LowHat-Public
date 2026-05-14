"use server";

import { db } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type TeamActionResult = {
  success: boolean;
  message: string;
} | null;

export async function createTeamAction(formData: FormData) {
  const session = await verifySession();
  if (!session || !session.isAuth || session.role !== "freelancer") {
    return;
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    return;
  }

  try {
    console.log("[createTeamAction] Creating team:", name);
    const [newTeam] = await db.insert(teams)
      .values({ name, description })
      .returning();

    await db.insert(teamMembers)
      .values({
        teamId: newTeam.id,
        userId: session!.userId,
        teamRole: "owner",
      });
      
    console.log("[createTeamAction] SUCCESS. Team ID:", newTeam.id);
  } catch (err: any) {
    console.error("[createTeamAction] Error:", err.message || err);
    throw new Error("Failed to create team: " + (err.message || String(err)));
  }

  revalidatePath("/team");
}

export async function updateTeamAction(
  _prevState: TeamActionResult,
  formData: FormData
): Promise<TeamActionResult> {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "freelancer") {
    return { success: false, message: "Not authenticated." };
  }

  const teamId = formData.get("teamId") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!teamId || !name) {
    return { success: false, message: "Unit name is required." };
  }
  
  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.userId)))
    .limit(1);

  if (!membership || membership.teamRole !== "owner") {
    return { success: false, message: "Only the unit owner can edit details." };
  }

  try {
    await db.update(teams)
      .set({ name, description, updatedAt: new Date() })
      .where(eq(teams.id, teamId));

    console.log("[updateTeamAction] SUCCESS. Team ID:", teamId);
  } catch (err: any) {
    console.error("[updateTeamAction] Error:", err.message || err);
    return { success: false, message: "Failed to update unit. Please try again." };
  }

  revalidatePath("/team");
  return { success: true, message: "Unit details updated." };
}
