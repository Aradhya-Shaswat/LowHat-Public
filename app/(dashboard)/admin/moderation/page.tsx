import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { verifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moderateVerificationAction } from "@/app/actions/admin";

export default async function AdminModerationPage() {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "admin") {
    redirect("/");
  }

  const pendingVerifications = await db.select()
    .from(verifications)
    .where(eq(verifications.status, "pending"))
    .orderBy(desc(verifications.createdAt));
  
  return (
    <div className="flex flex-col py-12 px-8 max-w-5xl min-h-full">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-heading text-foreground mb-2">Moderation Workbench</h1>
        <p className="text-muted-foreground text-sm">Review verifications, handle disputes, and monitor platform health.</p>
      </header>

      <div className="space-y-6">
        <h2 className="text-xl font-serif text-foreground">Pending Verifications ({pendingVerifications.length})</h2>
        {pendingVerifications.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card/30">
            <p className="text-sm text-muted-foreground">Queue is clear. No pending verifications.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingVerifications.map((v) => (
               <div key={v.id} className="p-5 border border-border rounded-xl bg-card flex justify-between items-center group hover:border-foreground/20 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {v.targetType}
                      </span>
                      <span className="text-xs text-muted-foreground">ID: {v.targetTeamId || v.targetUserId}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">Awaiting identity and capability review.</p>
                  </div>
                  <form action={moderateVerificationAction} className="flex items-center gap-2">
                    <input type="hidden" name="verificationId" value={v.id} />
                    <Button type="submit" name="status" value="rejected" variant="outline" size="sm" className="h-8 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <X className="w-3.5 h-3.5" /> Reject
                    </Button>
                    <Button type="submit" name="status" value="approved" size="sm" className="h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90">
                      <Check className="w-3.5 h-3.5" /> Approve
                    </Button>
                  </form>
               </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 space-y-6">
        <h2 className="text-xl font-serif text-foreground">Active Disputes (0)</h2>
        <div className="text-center py-16 border border-dashed border-border rounded-xl bg-card/30">
            <p className="text-sm text-muted-foreground">Platform execution is healthy.</p>
        </div>
      </div>
    </div>
  );
}
