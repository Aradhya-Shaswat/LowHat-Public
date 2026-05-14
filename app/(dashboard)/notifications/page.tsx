import Link from "next/link";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Bell, Info, MessageSquare, Briefcase, FileText } from "lucide-react";

function renderIcon(type: string) {
  switch (type) {
    case 'message': return <MessageSquare className="w-4 h-4 text-primary" />;
    case 'bid': return <FileText className="w-4 h-4 text-foreground" />;
    case 'job': return <Briefcase className="w-4 h-4 text-foreground" />;
    case 'project': return <Bell className="w-4 h-4 text-primary" />;
    default: return <Info className="w-4 h-4 text-muted-foreground" />;
  }
}

export default async function NotificationsPage() {
  const session = await verifySession();
  if (!session?.isAuth) {
    redirect("/login");
  }

  // Fetch notifications for the user
  const userNotifications = await db.select()
  .from(notifications)
  .where(eq(notifications.userId, session.userId))
  .orderBy(desc(notifications.createdAt));

  return (
    <div className="flex flex-col py-12 px-8 max-w-4xl mx-auto min-h-full">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-3xl font-heading text-foreground mb-2">Inbox & Notifications</h1>
        <p className="text-muted-foreground text-sm">Stay updated on your execution contracts and team messages.</p>
      </header>

      {userNotifications.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-xl bg-card/30">
          <Bell className="w-8 h-8 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-serif text-lg text-foreground mb-2">You're all caught up</h3>
          <p className="text-sm text-muted-foreground mb-6">No new notifications in your inbox at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
           {userNotifications.map((notif) => (
             <Link key={notif.id} href={notif.actionUrl || "#"} className="block group">
               <div className={`p-5 rounded-xl border flex gap-4 transition-colors ${notif.isRead ? 'border-transparent bg-background hover:bg-card hover:border-border' : 'border-border bg-card'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${notif.isRead ? 'bg-secondary/40' : 'bg-secondary/80 shadow-sm border border-border/50'}`}>
                    {renderIcon(notif.type)}
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between items-start mb-1">
                     <h4 className={`text-sm tracking-tight ${notif.isRead ? 'font-medium text-foreground/80' : 'font-semibold text-foreground'}`}>
                       {notif.title}
                     </h4>
                     <span className="text-[10px] text-muted-foreground font-medium">
                       {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric'})}
                     </span>
                   </div>
                   <p className={`text-sm line-clamp-2 ${notif.isRead ? 'text-muted-foreground' : 'text-foreground/90'}`}>
                     {notif.content}
                   </p>
                 </div>
                 {!notif.isRead && (
                   <div className="w-2 h-2 rounded-full bg-primary self-center flex-shrink-0"></div>
                 )}
               </div>
             </Link>
           ))}
        </div>
      )}
    </div>
  );
}