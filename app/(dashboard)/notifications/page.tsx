import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { 
  notifications, 
  messageThreads, 
  messageThreadParticipants, 
  messages, 
  users,
  projects,
  jobs 
} from "@/lib/db/schema";
import { eq, desc, and, or, sql, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NotificationsClient } from "@/components/notifications-client";
import { MessageSquare, Bell } from "lucide-react";

export default async function NotificationsPage() {
  const session = await verifySession();
  if (!session?.isAuth) redirect("/login");

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  const inboxThreads: any[] = [];
  const myParticipants = await db
    .select()
    .from(messageThreadParticipants)
    .where(eq(messageThreadParticipants.userId, session.userId));

  const threadIds = myParticipants.map(p => p.threadId);

  if (threadIds.length > 0) {
    const threadsData = await db
      .select({
        thread: messageThreads,
        project: projects,
        job: jobs,
      })
      .from(messageThreads)
      .leftJoin(projects, eq(messageThreads.projectId, projects.id))
      .leftJoin(jobs, eq(messageThreads.jobId, jobs.id))
      .where(inArray(messageThreads.id, threadIds))
      .orderBy(desc(messageThreads.updatedAt));

    const latestMessagesSubquery = db
      .select({
        threadId: messages.threadId,
        content: messages.content,
        createdAt: messages.createdAt,
        senderName: users.name,
        rowNum: sql<number>`row_number() over (partition by ${messages.threadId} order by ${messages.createdAt} desc)`.as("row_num"),
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(inArray(messages.threadId, threadIds))
      .as("latest_messages");

    const latestMessages = await db
      .select({
        threadId: latestMessagesSubquery.threadId,
        content: latestMessagesSubquery.content,
        createdAt: latestMessagesSubquery.createdAt,
        senderName: latestMessagesSubquery.senderName,
      })
      .from(latestMessagesSubquery)
      .where(eq(latestMessagesSubquery.rowNum, 1));

    const latestMessagesMap = new Map(latestMessages.map(m => [m.threadId, m]));

    for (const t of threadsData) {
      const lastMsg = latestMessagesMap.get(t.thread.id);
      const projectTitle = t.job?.title ?? t.thread.title ?? "Untitled Thread";

      inboxThreads.push({
        threadId: t.thread.id,
        projectTitle,
        lastMessage: lastMsg?.content ?? null,
        lastMessageAt: lastMsg?.createdAt ?? null,
        lastSenderName: lastMsg?.senderName ?? null,
        projectId: t.project?.id ?? null,
      });
    }
  }

  const unreadNotifCount = userNotifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full">
      <header className="border-b border-border pb-10 mb-12">
        <h1 className="text-4xl font-serif text-foreground mb-3">Inbox</h1>
        <p className="text-muted-foreground text-sm font-sans leading-relaxed">
          Operational alerts and project correspondence.
        </p>
      </header>

      {/* Messages Section */}
      {inboxThreads.length > 0 && (
        <section className="mb-20">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-8 font-sans">
            Project Correspondence
          </h2>
          <div className="flex flex-col border-t border-border/30">
            {inboxThreads.map((thread) => (
              <Link 
                key={thread.threadId} 
                href={thread.projectId ? `/projects/${thread.projectId}/chat` : `#`}
                className="group py-8 border-b border-border/50 flex flex-col md:flex-row md:items-start md:justify-between gap-6 hover:bg-primary/[0.01] transition-all"
              >
                <div className="space-y-3 flex-1">
                    <h3 className="text-2xl font-serif text-foreground group-hover:text-foreground/80 transition-colors">
                      {thread.projectTitle}
                    </h3>
                  {thread.lastMessage ? (
                    <p className="text-sm text-muted-foreground font-sans line-clamp-1 max-w-2xl leading-relaxed">
                      {thread.lastSenderName && <span className="font-semibold text-foreground/60">{thread.lastSenderName}: </span>}
                      {thread.lastMessage}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/30 font-sans">No messages yet.</p>
                  )}
                </div>
                {thread.lastMessageAt && (
                  <span className="text-[10px] text-muted-foreground font-sans pt-2 tabular-nums">
                    {new Date(thread.lastMessageAt).toLocaleDateString()}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Notifications Section */}
      <section>
        {inboxThreads.length > 0 && (
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-8 font-sans">
            System Alerts
          </h2>
        )}
        <NotificationsClient
          initialNotifications={userNotifications.map(n => ({
            id: n.id,
            type: n.type as any,
            title: n.title,
            content: n.content,
            actionUrl: n.actionUrl,
            isRead: n.isRead,
            createdAt: n.createdAt,
          }))}
        />
      </section>
    </div>
  );
}