"use server";

import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

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

  try {
    await db.insert(messages).values({
      threadId,
      senderId: session.userId,
      content,
    });
  } catch (err) {

  }

  revalidatePath(`/projects`);
}
