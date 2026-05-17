"use client";

import Link from "next/link";
import { useState, useTransition, useEffect } from "react";
import { Bell, Info, MessageSquare, Briefcase, FileText, CheckCheck } from "lucide-react";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/actions/notifications";

type NotificationType = "message" | "bid" | "job" | "project" | "system" | "unit_governance";

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
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="text-center py-24 border-t border-border/30">
        <p className="text-sm text-muted-foreground font-sans">No new records found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col border-t border-border/30">
      <div className="flex items-center justify-between py-6">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest font-sans">
          {unreadCount > 0 ? `${unreadCount} Unprocessed` : "All records processed"}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors disabled:opacity-50 font-sans"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex flex-col">
        {notifications.map((notif) => {
          const href = notif.actionUrl || "#";

          return (
            <div
              key={notif.id}
              className={`group border-b border-border/50 transition-all flex flex-col gap-3 py-10 ${
                notif.isRead ? "opacity-50" : ""
              }`}
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="text-2xl font-sans text-foreground leading-tight">
                      {notif.actionUrl ? (
                        <Link href={href} className="hover:text-foreground/70 transition-colors">
                          {notif.title}
                        </Link>
                      ) : notif.title}
                    </h4>
                  </div>
                  <div className="flex flex-col items-end gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground font-sans tabular-nums">
                      {mounted ? formatRelativeTime(notif.createdAt) : "..."}
                    </span>
                  </div>
                </div>

                {notif.content && (
                  <p className="text-sm text-muted-foreground font-sans max-w-2xl leading-relaxed">
                    {notif.content}
                  </p>
                )}

                {!notif.isRead && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleMarkRead(notif.id)}
                      disabled={isPending}
                      className="text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors disabled:opacity-30 font-sans"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
