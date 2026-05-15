"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bell, Info, MessageSquare, Briefcase, FileText, CheckCheck } from "lucide-react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/actions/notifications";

type NotificationType = "message" | "bid" | "job" | "project" | "system";

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  content: string | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: Date;
}

interface NotificationsClientProps {
  initialNotifications: NotificationItem[];
}

function renderIcon(type: NotificationType) {
  switch (type) {
    case "message": return <MessageSquare className="w-4 h-4" />;
    case "bid":     return <FileText className="w-4 h-4" />;
    case "job":     return <Briefcase className="w-4 h-4" />;
    case "project": return <Bell className="w-4 h-4" />;
    default:        return <Info className="w-4 h-4" />;
  }
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    startTransition(async () => {
      await markNotificationReadAction(id);
    });
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    startTransition(async () => {
      await markAllNotificationsReadAction();
    });
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-32">
        <h3 className="font-jersey text-4xl">LowHat</h3>
        <p className="text-sm text-muted-foreground mt-2 tracking-widest">No new records</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <span className="text-[10px] font-bold text-muted-foreground tracking-tight">
          {unreadCount > 0 ? `${unreadCount} Unprocessed` : "All records processed"}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-[10px] font-bold text-muted-foreground hover:text-foreground tracking-tight transition-colors disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex flex-col">
        {notifications.map((notif) => {
          const href = notif.actionUrl || "#";

          return (
            <div
              key={notif.id}
              className={`group border-b border-border/50 transition-colors relative ${
                notif.isRead ? "opacity-60 hover:opacity-100" : ""
              }`}
            >
              <div className="flex flex-col py-8">
                <div className="flex justify-between items-start mb-3 gap-8">
                  <div className="flex items-center gap-3">
                    {!notif.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                    <h4 className="text-xl font-serif text-foreground leading-tight">
                      {notif.actionUrl ? (
                        <Link href={href} className="hover:underline decoration-1 underline-offset-4">
                          {notif.title}
                        </Link>
                      ) : notif.title}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] text-muted-foreground font-bold tracking-tight tabular-nums">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        disabled={isPending}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-muted-foreground hover:text-foreground tracking-tight disabled:opacity-30 underline decoration-1 underline-offset-4"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>

                {notif.content && (
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                    {notif.content}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
