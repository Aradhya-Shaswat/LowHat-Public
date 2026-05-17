import { db } from "@/lib/db";
import { projects, jobs, messageThreads, messages, users, milestones, meetings, messageReads } from "@/lib/db/schema";
import { eq, asc, and, isNull, not, inArray } from "drizzle-orm";
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

  let threadMessages: { message: typeof messages.$inferSelect, sender: typeof users.$inferSelect, meeting: typeof meetings.$inferSelect | null }[] = [];
  let receiptsMap = new Map<string, string[]>();

  if (thread) {
    const unreadMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .leftJoin(
        messageReads,
        and(
          eq(messageReads.messageId, messages.id),
          eq(messageReads.userId, session.userId)
        )
      )
      .where(
        and(
          eq(messages.threadId, thread.id),
          isNull(messageReads.id),
          not(eq(messages.senderId, session.userId))
        )
      );

    if (unreadMessages.length > 0) {
      await db.insert(messageReads).values(
        unreadMessages.map(m => ({
          messageId: m.id,
          userId: session.userId,
        }))
      );
    }

    const data = await db.select({
      message: messages,
      sender: users,
      meeting: meetings,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .leftJoin(meetings, eq(messages.meetingId, meetings.id))
    .where(eq(messages.threadId, thread.id))
    .orderBy(asc(messages.createdAt));
    threadMessages = data;

    if (data.length > 0) {
      const readReceiptsData = await db
        .select({
          messageId: messageReads.messageId,
          userName: users.name,
          userId: users.id,
        })
        .from(messageReads)
        .innerJoin(users, eq(messageReads.userId, users.id))
        .where(
          inArray(
            messageReads.messageId,
            data.map(m => m.message.id)
          )
        );

      const userLatestReadMessageId = new Map<string, { messageId: string, name: string }>();
      const messageIndexMap = new Map<string, number>();
      data.forEach((m, idx) => {
        messageIndexMap.set(m.message.id, idx);
      });

      for (const r of readReceiptsData) {
        const messageIndex = messageIndexMap.get(r.messageId) ?? -1;
        const currentLatest = userLatestReadMessageId.get(r.userId);
        const currentLatestIndex = currentLatest ? (messageIndexMap.get(currentLatest.messageId) ?? -1) : -1;
        
        if (messageIndex > currentLatestIndex) {
          userLatestReadMessageId.set(r.userId, {
            messageId: r.messageId,
            name: r.userName.split(" ")[0]
          });
        }
      }
      
      for (const [_, info] of userLatestReadMessageId.entries()) {
        const list = receiptsMap.get(info.messageId) || [];
        list.push(info.name);
        receiptsMap.set(info.messageId, list);
      }
    }
  }

  const formattedMessages = threadMessages.map(m => ({
    id: m.message.id,
    content: m.message.content,
    createdAt: m.message.createdAt,
    senderName: (m.sender.name || "User").split(" ")[0],
    senderId: m.sender.id,
    isMe: m.sender.id === session.userId,
    meeting: m.meeting,
    readBy: (receiptsMap.get(m.message.id) || []).filter(name => name !== (m.sender.name || "User").split(" ")[0]),
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
