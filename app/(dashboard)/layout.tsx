import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { teams, teamMembers, notifications, users } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { CollapsibleDashboardLayout } from "@/components/collapsible-dashboard-layout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  
  if (!session?.isAuth) {
    redirect("/login");
  }

  const { role, userId } = session;

  const [currentUser] = await db.select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const userName = currentUser?.name || "User";
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  let userTeam = null;
  if (role === "freelancer") {
    const tm = await db.select({ team: teams })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, session.userId))
      .limit(1);
    if (tm.length > 0) {
      userTeam = tm[0].team;
    }
  }

    const unreadNotificationsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, session.userId), eq(notifications.isRead, false)))
      .then(res => Number(res[0].count));

  return (
    <CollapsibleDashboardLayout
      userName={userName}
      initials={initials}
      userTeam={userTeam}
      unreadNotificationsCount={unreadNotificationsCount}
      role={role}
    >
      {children}
    </CollapsibleDashboardLayout>
  );
}