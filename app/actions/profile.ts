"use server";

import { db } from "@/lib/db";
import { users, freelancerProfiles, clientProfiles } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendNotification } from "@/lib/notifications";
import { validateProfanity } from "@/lib/profanity";

export type ProfileActionResult = {
  success: boolean;
  message: string;
} | null;

export async function updateProfileAction(
  _prevState: ProfileActionResult,
  formData: FormData
): Promise<ProfileActionResult> {
  const session = await verifySession();
  if (!session?.isAuth) {
    return { success: false, message: "Not authenticated." };
  }
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const fullName = `${firstName} ${lastName}`.trim();

  const nameProfanity = validateProfanity(firstName, "first name") || validateProfanity(lastName, "last name");
  if (nameProfanity) {
    return { success: false, message: nameProfanity };
  }

  try {
    // console.log("[updateProfileAction] session:", session);
    // console.log("[updateProfileAction] fullName:", fullName);

    await db.update(users)
      .set({ name: fullName })
      .where(eq(users.id, session!.userId));

    // console.log("[updateProfileAction] updated users table");

    if (session!.role === "freelancer") {
      const title = formData.get("title") as string;
      const hourlyRate = parseInt(formData.get("hourlyRate") as string, 10);
      const bio = formData.get("bio") as string;

      const freelancerProfanity = validateProfanity(title, "title") || validateProfanity(bio, "bio");
      if (freelancerProfanity) {
        return { success: false, message: freelancerProfanity };
      }

      await db.update(freelancerProfiles)
        .set({
          title,
          hourlyRate: isNaN(hourlyRate) ? null : hourlyRate * 100,
          bio,
        })
        .where(eq(freelancerProfiles.userId, session!.userId));
    } else if (session!.role === "client") {
      const companyName = formData.get("companyName") as string;
      const industry = formData.get("industry") as string;

      const clientProfanity = validateProfanity(companyName, "company name") || validateProfanity(industry, "industry");
      if (clientProfanity) {
        return { success: false, message: clientProfanity };
      }

      await db.update(clientProfiles)
        .set({
          companyName,
          industry,
        })
        .where(eq(clientProfiles.userId, session!.userId));
    }

    await sendNotification({
      userId: session!.userId,
      type: "system",
      title: "Profile Updated",
      content: "Your profile information has been successfully updated.",
    });

    // console.log("[updateProfileAction] SUCCESS");
  } catch (err: any) {
    console.error("[updateProfileAction] Error:", err.message || err);
    return { success: false, message: "Failed to save changes. Please try again." };
  }

  revalidatePath("/profile");
  return { success: true, message: "Profile updated successfully." };
}
