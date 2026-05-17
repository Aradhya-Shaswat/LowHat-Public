"use server";

import { db } from "@/lib/db";
import { messages, meetings, users, messageReads } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { eq, asc, inArray, and, isNull, not } from "drizzle-orm";
import { cleanProfanity } from "@/lib/profanity";

export async function getThreadMessagesAction(threadId: string, currentUserId: string) {
  const session = await verifySession();
  if (!session?.isAuth) return { success: false, messages: [] };

  try {
    const unreadMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .leftJoin(
        messageReads,
        and(
          eq(messageReads.messageId, messages.id),
          eq(messageReads.userId, currentUserId)
        )
      )
      .where(
        and(
          eq(messages.threadId, threadId),
          isNull(messageReads.id),
          not(eq(messages.senderId, currentUserId))
        )
      );

    if (unreadMessages.length > 0) {
      await db.insert(messageReads).values(
        unreadMessages.map(m => ({
          messageId: m.id,
          userId: currentUserId,
        }))
      );
    }

    const data = await db.select({
      message: messages,
      sender: users,
      meeting: meetings,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .leftJoin(meetings, eq(messages.meetingId, meetings.id))
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt));

    const receiptsMap = new Map<string, string[]>();
    if (data.length > 0) {
      const readReceiptsData = await db
        .select({
          messageId: messageReads.messageId,
          userName: users.name,
          userId: users.id,
        })
        .from(messageReads)
        .innerJoin(users, eq(messageReads.userId, users.id))
        .where(
          inArray(
            messageReads.messageId,
            data.map(m => m.message.id)
          )
        );

      const userLatestReadMessageId = new Map<string, { messageId: string, name: string }>();
      const messageIndexMap = new Map<string, number>();
      data.forEach((m, idx) => {
        messageIndexMap.set(m.message.id, idx);
      });

      for (const r of readReceiptsData) {
        const messageIndex = messageIndexMap.get(r.messageId) ?? -1;
        const currentLatest = userLatestReadMessageId.get(r.userId);
        const currentLatestIndex = currentLatest ? (messageIndexMap.get(currentLatest.messageId) ?? -1) : -1;
        
        if (messageIndex > currentLatestIndex) {
          userLatestReadMessageId.set(r.userId, {
            messageId: r.messageId,
            name: r.userName.split(" ")[0]
          });
        }
      }

      for (const [_, info] of userLatestReadMessageId.entries()) {
        const list = receiptsMap.get(info.messageId) || [];
        list.push(info.name);
        receiptsMap.set(info.messageId, list);
      }
    }

    const formatted = data.map(m => ({
      id: m.message.id,
      content: m.message.content,
      createdAt: m.message.createdAt,
      senderName: (m.sender.name || "User").split(" ")[0],
      senderId: m.sender.id,
      isMe: m.sender.id === currentUserId,
      meeting: m.meeting,
      readBy: (receiptsMap.get(m.message.id) || []).filter(name => name !== (m.sender.name || "User").split(" ")[0]),
    }));

    return { success: true, messages: formatted };
  } catch (err) {
    console.error(err);
    return { success: false, messages: [] };
  }
}

export async function deleteMessageAction(messageId: string) {
  const session = await verifySession();
  if (!session?.isAuth) return { success: false, error: "Unauthorized" };

  try {
    const [msg] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
    if (!msg) return { success: false, error: "Message not found" };

    if (msg.senderId !== session.userId) {
      return { success: false, error: "Unauthorized to delete this message" };
    }

    await db.delete(messages).where(eq(messages.id, messageId));
    revalidatePath(`/projects`);
    return { success: true };
  } catch (err) {
    console.error("Failed to delete message:", err);
    return { success: false, error: "Failed to delete message" };
  }
}

export async function sendMessageAction(formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth) {
    return;
  }

  const threadId = formData.get("threadId") as string;
  const content = formData.get("content") as string;

  if (!threadId || !content) {
    return;
  }

  const cleanedContent = cleanProfanity(content);

  try {
    await db.insert(messages).values({
      threadId,
      senderId: session.userId,
      content: cleanedContent,
    });
  } catch (err) {}

  revalidatePath(`/projects`);
}

export async function createMeetingAction(formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth) return;

  const threadId = formData.get("threadId") as string;
  const url = formData.get("url") as string;

  if (!threadId || !url) return;

  try {
    const [meeting] = await db.insert(meetings).values({
      threadId,
      initiatorId: session.userId,
      url,
    }).returning();

    await db.insert(messages).values({
      threadId,
      senderId: session.userId,
      content: `Meeting initiated`,
      isSystem: true,
      meetingId: meeting.id,
    });
  } catch (err) {
    console.error("Failed to create meeting:", err);
  }

  revalidatePath(`/projects`);
}
