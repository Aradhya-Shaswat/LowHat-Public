"use server";

import { db } from "@/lib/db";
import { clientProfiles, freelancerProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendNotification } from "@/lib/notifications";

export async function initProfileAction(userId: string, intent: "client" | "freelancer" | "admin", email: string, name: string) {
  try {
    let [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          id: userId,
          email,
          name,
          role: intent,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.email,
          set: { role: intent, name, updatedAt: new Date() },
        })
        .returning();
    } else {
      await db.update(users).set({ role: intent, updatedAt: new Date() }).where(eq(users.id, user.id));
    }

    const effectiveId = user.id;

    if (intent === "client") {
      const existing = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, effectiveId));
      if (existing.length === 0) {
        await db.insert(clientProfiles).values({ userId: effectiveId });
      }
    } else if (intent === "freelancer") {
      const existing = await db.select().from(freelancerProfiles).where(eq(freelancerProfiles.userId, effectiveId));
      if (existing.length === 0) {
        await db.insert(freelancerProfiles).values({ userId: effectiveId });
      }
    }

    await sendNotification({
      userId: effectiveId,
      type: "system",
      title: "Welcome to LowHat",
      content: `Your profile has been initialized as a ${intent}. Welcome aboard!`,
    });

    return { success: true };
  } catch (err: any) {
    console.error("initProfileAction error:", err);
    return { error: "Failed to initialize profile: " + (err.message || String(err)) };
  }
}
