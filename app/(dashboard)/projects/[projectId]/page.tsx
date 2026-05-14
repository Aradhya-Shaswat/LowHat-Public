import Link from "next/link";
import { db } from "@/lib/db";
import { projects, jobs, messageThreads, messages, users } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { sendMessageAction } from "@/app/actions/messages";

export default async function ProjectWorkspacePage({ params }: { params: { projectId: string } }) {
  const session = await verifySession();
  if (!session?.isAuth) {
    redirect("/login");
  }

  const [project] = await db.select({
    project: projects,
    job: jobs,
  })
  .from(projects)
  .innerJoin(jobs, eq(projects.jobId, jobs.id))
  .where(eq(projects.id, params.projectId))
  .limit(1);

  if (!project) redirect("/projects");

  const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.projectId, project.project.id)).limit(1);
  
  let threadMessages: { message: typeof messages.$inferSelect, sender: typeof users.$inferSelect }[] = [];
  if (thread) {
    const data = await db.select({
      message: messages,
      sender: users,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.threadId, thread.id))
    .orderBy(asc(messages.createdAt));
    threadMessages = data;
  }

  return (
    <div className="flex flex-col h-full bg-background relative max-w-7xl w-full">
      <header className="h-20 border-b border-border flex items-center px-8 bg-card flex-shrink-0 sticky top-0 z-10">
        <div className="flex-1">
          <Link href="/projects" className="text-muted-foreground hover:text-foreground inline-flex items-center text-xs font-medium transition-colors mb-1">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Active Projects
          </Link>
          <h1 className="text-xl font-heading text-foreground">{project.job.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-muted-foreground mr-2">Status:</span>
            <span className="font-medium text-primary uppercase tracking-wider text-xs">{project.project.status}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r border-border bg-background p-6 overflow-y-auto hidden md:block">
          <h2 className="font-serif text-lg text-foreground mb-6">Execution Deliverables</h2>
          <div className="space-y-4">
             <div className="p-4 border border-border border-l-4 border-l-primary rounded-r-md bg-card/50">
               <h3 className="text-sm font-medium text-foreground">Phase 1: Architecture Review</h3>
               <p className="text-xs text-muted-foreground mt-1">Due in 3 days</p>
               <span className="text-xs font-semibold text-primary mt-2 block uppercase">In Progress</span>
             </div>
             <div className="p-4 border border-border rounded-md bg-card/20 opacity-60 hover:opacity-100 transition-opacity">
               <h3 className="text-sm font-medium text-foreground">Phase 2: Database Migration</h3>
               <p className="text-xs text-muted-foreground mt-1">Due in 14 days</p>
               <span className="text-xs text-muted-foreground mt-2 block uppercase">Pending</span>
             </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-card/10 relative">
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {!thread || threadMessages.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm mt-12 py-12 border border-dashed border-border rounded-xl">
                 No messages in this workspace yet.
              </div>
            ) : (
              threadMessages.map((msgLine) => {
                const isMe = msgLine.sender.id === session.userId;
                return (
                  <div key={msgLine.message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-medium text-foreground font-sans">{msgLine.sender.name?.split(" ")[0]}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(msgLine.message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${isMe ? 'bg-foreground text-background rounded-tr-sm' : 'bg-secondary/40 border border-border text-foreground rounded-tl-sm'}`}>
                      {msgLine.message.content}
                    </div>
                  </div>
                )
              })
            )}
          </div>
          
          <div className="p-6 bg-background border-t border-border">
            <form action={sendMessageAction} className="relative flex items-center">
              <input type="hidden" name="threadId" value={thread?.id} />
              <input 
                 name="content"
                 type="text" 
                 placeholder="Type a message to the team..." 
                 className="w-full px-5 py-3 pr-14 bg-card border border-border rounded-full text-sm outline-none focus:border-foreground/30 transition-colors shadow-sm"
                 required
              />
              <button type="submit" className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-foreground text-background hover:bg-foreground/90 rounded-full flex items-center justify-center transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
