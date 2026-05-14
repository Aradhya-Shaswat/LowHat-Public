"use server";

import { db } from "@/lib/db";
import { clientProfiles, freelancerProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function initProfileAction(userId: string, intent: "client" | "freelancer" | "admin") {
  try {
    // Verify user exists (Better Auth created them)
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return { error: "User not found." };
    }

    // Create role-specific profile
    if (intent === "client") {
      const existing = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, userId));
      if (existing.length === 0) {
        await db.insert(clientProfiles).values({ userId });
      }
    } else if (intent === "freelancer") {
      const existing = await db.select().from(freelancerProfiles).where(eq(freelancerProfiles.userId, userId));
      if (existing.length === 0) {
        await db.insert(freelancerProfiles).values({ userId });
      }
    }

    // Set role on the user record
    await db.update(users).set({ role: intent }).where(eq(users.id, userId));

    return { success: true };
  } catch (err: any) {
    console.error("Profile initialization error:", err);
    return { error: "Failed to initialize profile." };
  }
}
