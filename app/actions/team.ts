"use server";

import { db } from "@/lib/db";
import { teams, teamMembers } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

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
