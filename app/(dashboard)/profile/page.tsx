import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { users, freelancerProfiles, clientProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await verifySession();
  if (!session?.isAuth) {
    redirect("/login");
  }

  // Find user data
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const nameParts = (user?.name || "").split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  let freelancerProfile = null;
  let clientProfile = null;

  if (session.role === "freelancer") {
    const res = await db.select().from(freelancerProfiles).where(eq(freelancerProfiles.userId, session.userId)).limit(1);
    if (res.length > 0) freelancerProfile = res[0];
  } else if (session.role === "client") {
    const res = await db.select().from(clientProfiles).where(eq(clientProfiles.userId, session.userId)).limit(1);
    if (res.length > 0) clientProfile = res[0];
  }

  return (
    <div className="flex flex-col py-12 px-8 max-w-3xl mx-auto min-h-full">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-heading text-foreground mb-2">Profile & Settings</h1>
        <p className="text-muted-foreground text-sm">Update your marketplace identity.</p>
      </header>

      <form className="space-y-8 pb-12">
        <div className="space-y-6 bg-card border border-border/80 shadow-sm p-6 rounded-xl">
          <h2 className="text-xl font-serif text-foreground mb-4">Personal Information</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">First Name</label>
              <input type="text" defaultValue={firstName} className="w-full px-3 py-2 bg-transparent border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-md text-sm outline-none focus:border-foreground/30 transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Last Name</label>
              <input type="text" defaultValue={lastName} className="w-full px-3 py-2 bg-transparent border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-md text-sm outline-none focus:border-foreground/30 transition-colors" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email Address</label>
            <input type="email" defaultValue={user?.email || ""} disabled className="w-full px-3 py-2 bg-muted/30 border border-border rounded-md text-sm text-muted-foreground cursor-not-allowed" />
          </div>
        </div>

        {session.role === "freelancer" && freelancerProfile && (
          <div className="space-y-6 bg-card border border-border/80 shadow-sm p-6 rounded-xl">
            <h2 className="text-xl font-serif text-foreground mb-4">Execution Profile</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Professional Title</label>
              <input type="text" defaultValue={freelancerProfile.title || ""} placeholder="e.g. Senior Go Engineer" className="w-full px-3 py-2 bg-transparent border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-md text-sm outline-none focus:border-foreground/30 transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Hourly Rate (USD)</label>
              <input type="number" defaultValue={(freelancerProfile.hourlyRate || 0)/100} placeholder="e.g. 100" className="w-full px-3 py-2 bg-transparent border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-md text-sm outline-none focus:border-foreground/30 transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Bio</label>
              <textarea rows={4} defaultValue={freelancerProfile.bio || ""} placeholder="Detail your specific competencies..." className="w-full px-3 py-2.5 bg-transparent border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-md text-sm outline-none focus:border-foreground/30 transition-colors resize-y leading-relaxed"></textarea>
            </div>
          </div>
        )}

        {session.role === "client" && clientProfile && (
          <div className="space-y-6 bg-card border border-border/80 shadow-sm p-6 rounded-xl">
            <h2 className="text-xl font-serif text-foreground mb-4">Company Profile</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company Name</label>
              <input type="text" defaultValue={clientProfile.companyName || ""} placeholder="Acme Corp" className="w-full px-3 py-2 bg-transparent border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-md text-sm outline-none focus:border-foreground/30 transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Industry</label>
              <input type="text" defaultValue={clientProfile.industry || ""} placeholder="FinTech" className="w-full px-3 py-2 bg-transparent border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-md text-sm outline-none focus:border-foreground/30 transition-colors" />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
           <Button type="button" className="bg-foreground text-background hover:bg-foreground/90 px-8 h-8 text-sm">
              Save Changes
           </Button>
        </div>
      </form>
    </div>
  );
}