import { db } from "@/lib/db";
import { projects, jobs, messageThreads, messages, users, milestones } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { sendMessageAction } from "@/app/actions/messages";
import { ChatWorkspace } from "@/components/chat-workspace";
import { DeliverablesSidebar } from "@/components/deliverables-sidebar";

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

  const isClient = project.project.clientId === session.userId;

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
        <DeliverablesSidebar
          milestones={projectMilestones.map(m => ({
            id: m.id,
            title: m.title,
            dueDate: m.dueDate ? m.dueDate.toISOString() : null,
            status: m.status,
            assignedTo: m.assignedTo,
          }))}
          isClient={isClient}
          projectId={project.project.id}
        />

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
