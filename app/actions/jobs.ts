"use server";

import { db } from "@/lib/db";
import { jobs, users } from "@/lib/db/schema";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";

export async function createJobAction(prevState: any, formData: FormData) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "client") {
    return { error: "Unauthorized. Only clients can post jobs." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const budgetMin = parseInt(formData.get("budgetMin") as string, 10);
  const budgetMax = parseInt(formData.get("budgetMax") as string, 10);

  if (!title || !description || isNaN(budgetMin) || isNaN(budgetMax)) {
    return { error: "All fields are required and budgets must be valid numbers." };
  }

  try {
    await db.insert(jobs).values({
      clientId: session.userId,
      title,
      description,
      budgetMin: budgetMin * 100, // store in cents
      budgetMax: budgetMax * 100, // store in cents
      status: "open",
    });
  } catch (err) {
    console.error("Error creating job:", err);
    return { error: "Failed to post job." };
  }

  redirect("/my-jobs");
}

export async function mockAIJobAssistantAction(description: string) {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "client") {
    return { error: "Unauthorized" };
  }

  // MOCK AI LOGIC (Replace with real AI call once required by product)
  // This simulates the "job scoping assistance" requirement.
  const optimizedDescription = `(AI Scoped) Expected deliverables:
- Architecture review
- Secure execution pipeline
- Testing guarantees

Original description base:
${description}`;

  return { optimizedDescription, suggestedMin: 5000, suggestedMax: 15000 };
}
