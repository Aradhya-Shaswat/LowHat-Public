import { db } from "./db";
import { notifications } from "./db/schema";

export type NotificationType = 'message' | 'bid' | 'job' | 'project' | 'system' | 'unit_governance';

export async function sendNotification({
  userId,
  type,
  title,
  content,
  actionUrl,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  actionUrl?: string;
}) {
  try {
    await db.insert(notifications).values({
      userId,
      type,
      title,
      content,
      actionUrl,
      createdAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send notification:", error);
    return { success: false, error };
  }
}
