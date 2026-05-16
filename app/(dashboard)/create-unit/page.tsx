import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { createUnitAction } from "@/app/actions/units";
import { db } from "@/lib/db";
import { teamMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function CreateUnitPage() {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "freelancer") {
    redirect("/");
  }

  
  const existing = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, session.userId))
    .limit(1);

  if (existing.length > 0) {
    redirect("/my-unit");
  }

  return (
    <div className="flex flex-col py-16 px-8 md:px-12 w-full min-h-full max-w-2xl mx-auto">
      <header className="mb-12 text-center space-y-4">
        <h1 className="text-4xl font-serif text-foreground">Initialize Execution Unit</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
          Form a professional operational collective to execute on complex contracts and build collective reputation.
        </p>
      </header>

      <section className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm">
        <form 
          action={async (formData) => {
            "use server";
            await createUnitAction(formData);
          }} 
          className="space-y-8"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Unit Designation</label>
              <input 
                name="name" 
                type="text" 
                placeholder="e.g. Lambda Operations Group" 
                required 
                className="w-full px-4 py-3 bg-foreground/[0.02] border border-border/50 rounded-xl text-sm outline-none focus:border-foreground/20 focus:bg-foreground/[0.04] transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Operational Mandate</label>
              <textarea 
                name="description" 
                placeholder="Describe your unit's core capabilities and execution focus..." 
                className="w-full px-4 py-3 bg-foreground/[0.02] border border-border/50 rounded-xl text-sm outline-none focus:border-foreground/20 focus:bg-foreground/[0.04] h-32 resize-none transition-all"
              ></textarea>
            </div>
          </div>

          <div className="pt-6 border-t border-border/30">
            <div className="flex items-start gap-3 mb-8">
              <input 
                type="checkbox" 
                name="agreementsAccepted" 
                id="agreementsAccepted" 
                required
                className="mt-1 h-4 w-4 rounded border-border text-foreground focus:ring-foreground"
              />
              <label htmlFor="agreementsAccepted" className="text-xs text-muted-foreground leading-relaxed">
                I accept the <span className="text-foreground font-medium underline cursor-help">Unit Operational Agreements</span>, including governance protocols, handover obligations, and professional conduct standards.
              </label>
            </div>

            <button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90 h-12 rounded-xl text-sm font-medium transition-all shadow-md active:scale-[0.98]">
              Form Operational Unit
            </button>
          </div>
        </form>
      </section>

      <footer className="mt-12 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
          All units are subject to platform verification and moderation.
        </p>
      </footer>
    </div>
  );
}
