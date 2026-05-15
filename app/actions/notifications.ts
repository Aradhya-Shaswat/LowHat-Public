"use server";

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function markNotificationReadAction(notificationId: string) {
  const session = await verifySession();
  if (!session?.isAuth) return { error: "Unauthorized" };

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, session.userId)
      )
    );

  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const session = await verifySession();
  if (!session?.isAuth) return { error: "Unauthorized" };

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.userId, session.userId),
        eq(notifications.isRead, false)
      )
    );

  revalidatePath("/notifications");
  return { success: true };
}
