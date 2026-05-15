import { db } from "@/lib/db";
import { notifications, messageThreads, messageThreadParticipants, messages, projects, jobs, users } from "@/lib/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { NotificationsClient } from "@/components/notifications-client";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default async function NotificationsPage() {
  const session = await verifySession();
  if (!session?.isAuth) {
    redirect("/login");
  }

  const userNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.userId))
    .orderBy(desc(notifications.createdAt));

  const participantThreads = await db
    .select({
      threadId: messageThreadParticipants.threadId,
    })
    .from(messageThreadParticipants)
    .where(eq(messageThreadParticipants.userId, session.userId));

  const threadIds = participantThreads.map(p => p.threadId);

  type InboxThread = {
    threadId: string;
    projectTitle: string | null;
    lastMessage: string | null;
    lastMessageAt: Date | null;
    lastSenderName: string | null;
    projectId: string | null;
  };

  let inboxThreads: InboxThread[] = [];

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

    for (const t of threadsData) {
      const [lastMsg] = await db
        .select({ content: messages.content, createdAt: messages.createdAt, senderName: users.name })
        .from(messages)
        .innerJoin(users, eq(messages.senderId, users.id))
        .where(eq(messages.threadId, t.thread.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

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
      <header className="mb-12 border-b border-border pb-8">
        <h1 className="text-4xl font-heading text-foreground mb-3">Inbox</h1>
        <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Central record of your execution contracts, identity verifications, and unit communications.
        </p>
      </header>
      {inboxThreads.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
            Messages
          </h2>
          <div className="flex flex-col gap-0">
            {inboxThreads.map((thread) => (
              <Link
                key={thread.threadId}
                href={thread.projectId ? `/projects/${thread.projectId}` : "#"}
                className="group flex gap-4 items-start py-5 border-b border-border -mx-8 md:-mx-12 px-8 md:px-12 hover:bg-secondary/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-secondary/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-0.5">
                    <h4 className="text-sm font-semibold text-foreground truncate">{thread.projectTitle}</h4>
                    {thread.lastMessageAt && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 tabular-nums">
                        {new Date(thread.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  {thread.lastMessage ? (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {thread.lastSenderName && <span className="font-medium text-foreground/70">{thread.lastSenderName}: </span>}
                      {thread.lastMessage}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">No messages yet</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        {inboxThreads.length > 0 && (
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
            Notifications
          </h2>
        )}
        <NotificationsClient
          initialNotifications={userNotifications.map(n => ({
            id: n.id,
            type: n.type,
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