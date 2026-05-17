import { db } from "@/lib/db";
import { 
  joinRequests, 
  removalRequests, 
  teamMembers, 
  ownershipTransfers,
  unitAuditLogs 
} from "@/lib/db/schema";
import { eq, and, lt, sql, not } from "drizzle-orm";


export async function runUnitLifecycleChecks() {
  // console.log("[Worker] Starting unit lifecycle checks...");

  
  const expiredCount = await db
    .update(joinRequests)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(and(
      eq(joinRequests.status, 'pending'),
      lt(joinRequests.expiresAt, new Date())
    ));
  
  if (expiredCount) console.log(`E`);

  
  
  const readyToRemove = await db
    .select()
    .from(removalRequests)
    .where(and(
      eq(removalRequests.status, 'cooling'),
      lt(removalRequests.coolingEndsAt, new Date())
    ));

  for (const request of readyToRemove) {
    
    const incompleteTransfers = await db
      .select()
      .from(ownershipTransfers)
      .where(and(
        eq(ownershipTransfers.removalRequestId, request.id),
        eq(ownershipTransfers.completed, false)
      ))
      .limit(1);

    if (incompleteTransfers.length === 0) {
      // console.log(`[Worker] Finalizing removal for user ${request.targetUserId} in team ${request.teamId}`);
      
      try {
        await db.transaction(async (tx) => {
          
          await tx.delete(teamMembers).where(and(
            eq(teamMembers.teamId, request.teamId),
            eq(teamMembers.userId, request.targetUserId)
          ));

          
          await tx.update(removalRequests)
            .set({ status: 'completed', updatedAt: new Date() })
            .where(eq(removalRequests.id, request.id));

          
          await tx.insert(unitAuditLogs).values({
            teamId: request.teamId,
            actorUserId: "SYSTEM",
            action: 'removal_finalized',
            targetUserId: request.targetUserId,
            details: JSON.stringify({ requestId: request.id }),
          });
        });
      } catch (err) {
        // console.error(`[Worker] Failed to finalize removal ${request.id}:`, err);
      }
    } else {
      // console.log(`[Worker] Removal ${request.id} delayed: pending ownership transfers.`);
    }
  }

  // console.log("[Worker] Lifecycle checks complete.");
}
