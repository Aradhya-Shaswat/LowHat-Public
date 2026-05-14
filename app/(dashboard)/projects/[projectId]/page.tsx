import Link from "next/link";
import { db } from "@/lib/db";
import { projects, jobs, messageThreads, messages, users, milestones } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { sendMessageAction } from "@/app/actions/messages";

import { ChatWorkspace } from "@/components/chat-workspace";

export default async function ProjectWorkspacePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
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
  .where(eq(projects.id, projectId))
  .limit(1);

  if (!project) redirect("/projects");

  const [thread] = await db.select().from(messageThreads).where(eq(messageThreads.projectId, project.project.id)).limit(1);
  const projectMilestones = await db.select().from(milestones).where(eq(milestones.projectId, project.project.id)).orderBy(asc(milestones.dueDate));
  
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

  const formattedMessages = threadMessages.map(m => ({
    id: m.message.id,
    content: m.message.content,
    createdAt: m.message.createdAt,
    senderName: (m.sender.name || "User").split(" ")[0],
    isMe: m.sender.id === session.userId
  }));

  return (
    <div className="flex flex-col h-full bg-background relative w-full">
      <header className="h-20 border-b border-border flex items-center px-8 bg-card flex-shrink-0 sticky top-0 z-10">
        <div className="flex-1">
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
             {projectMilestones.length === 0 ? (
               <p className="text-xs text-muted-foreground italic">No milestones defined for this contract.</p>
             ) : (
               projectMilestones.map((m) => (
                 <div key={m.id} className={`p-4 border border-border rounded-md bg-card/20 ${m.isCompleted ? 'opacity-60' : 'border-l-4 border-l-primary'}`}>
                   <h3 className="text-sm font-medium text-foreground">{m.title}</h3>
                   {m.dueDate && (
                     <p className="text-xs text-muted-foreground mt-1">Due {new Date(m.dueDate).toLocaleDateString()}</p>
                   )}
                   <span className={`text-xs font-semibold mt-2 block uppercase ${m.isCompleted ? 'text-muted-foreground' : 'text-primary'}`}>
                     {m.isCompleted ? 'Completed' : 'Active'}
                   </span>
                 </div>
               ))
             )}
          </div>
        </aside>

        <ChatWorkspace 
          threadId={thread?.id} 
          projectId={project.project.id}
          initialMessages={formattedMessages}
          currentUserId={session.userId}
        />
      </div>
    </div>
  );
}
