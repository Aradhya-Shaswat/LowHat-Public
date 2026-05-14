"use server";

import { db } from "@/lib/db";
import { verifications } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function moderateVerificationAction(formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "admin") {
    return;
  }

  const verificationId = formData.get("verificationId") as string;
  const status = formData.get("status") as "approved" | "rejected";

  if (!verificationId || !status) {
    return;
  }

  try {
    await db.update(verifications)
      .set({ status })
      .where(eq(verifications.id, verificationId));
  } catch (err) {

  }

  redirect("/admin/moderation");
}
