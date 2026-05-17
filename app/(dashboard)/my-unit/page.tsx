import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { 
  teams, 
  teamMembers, 
  users, 
  joinRequests, 
  removalRequests,
  removalVotes,
  unitAuditLogs,
  ownershipTransfers
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { UnitHeader } from "@/components/unit-header";
import { UnitRoster } from "@/components/unit-roster";
import { UnitJoinRequests } from "@/components/unit-join-requests";
import { UnitGovernance } from "@/components/unit-governance";
import { UnitAuditLogView } from "@/components/unit-audit-log-view";
import { UnitOffboardingZone } from "@/components/unit-offboarding-zone";
import { TeamEditForm } from "@/components/team-edit-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function MyUnitPage() {
  const session = await verifySession();
  if (!session?.isAuth || session.role !== "freelancer") {
    redirect("/");
  }

  
  const memberships = await db
    .select({
      team: teams,
      role: teamMembers.teamRole,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, session.userId))
    .limit(1);

  if (memberships.length === 0) {
    redirect("/find-units");
  }

  const unit = memberships[0].team;
  const userRole = memberships[0].role;

  
  const members = await db
    .select({
      user: users,
      role: teamMembers.teamRole,
      joinedAt: teamMembers.joinedAt,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, unit.id));

  const pendingRequests = await db
    .select({
      request: joinRequests,
      user: users,
    })
    .from(joinRequests)
    .innerJoin(users, eq(joinRequests.userId, users.id))
    .where(and(
      eq(joinRequests.teamId, unit.id),
      eq(joinRequests.status, 'pending')
    ));

  const activeRemovals = await db
    .select({
      request: removalRequests,
      target: users,
      userVote: removalVotes,
    })
    .from(removalRequests)
    .innerJoin(users, eq(removalRequests.targetUserId, users.id))
    .leftJoin(removalVotes, and(
      eq(removalRequests.id, removalVotes.removalRequestId),
      eq(removalVotes.voterUserId, session.userId)
    ))
    .where(and(
      eq(removalRequests.teamId, unit.id),
      eq(removalRequests.status, 'pending')
    ));

  const coolingRemovals = await db
    .select({
      request: removalRequests,
      target: users,
    })
    .from(removalRequests)
    .innerJoin(users, eq(removalRequests.targetUserId, users.id))
    .where(and(
      eq(removalRequests.teamId, unit.id),
      eq(removalRequests.status, 'cooling')
    ));

  const auditLogs = await db
    .select({
      log: unitAuditLogs,
      actor: users,
    })
    .from(unitAuditLogs)
    .innerJoin(users, eq(unitAuditLogs.actorUserId, users.id))
    .where(eq(unitAuditLogs.teamId, unit.id))
    .orderBy(desc(unitAuditLogs.createdAt))
    .limit(20);

  
  const userOffboarding = coolingRemovals.find(r => r.request.targetUserId === session.userId);
  const removalTargetIds = [
    ...activeRemovals.map(r => r.request.targetUserId),
    ...coolingRemovals.map(r => r.request.targetUserId)
  ];

  return (
    <div className="flex flex-col py-12 px-8 md:px-12 w-full min-h-full space-y-12">
      <UnitHeader unit={unit} userRole={userRole} />

      {userOffboarding && (
        <UnitOffboardingZone 
          request={userOffboarding.request} 
          unitId={unit.id}
        />
      )}

      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="bg-transparent border-b border-border w-full justify-start h-auto p-0 gap-8 mb-8">
          <TabsTrigger value="roster" className="bg-transparent border-none p-0 pb-4 text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none">
            Roster
          </TabsTrigger>
          {(userRole === 'owner' || userRole === 'manager') && (
            <TabsTrigger value="requests" className="bg-transparent border-none p-0 pb-4 text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none relative">
              Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-4 bg-foreground text-background text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="governance" className="bg-transparent border-none p-0 pb-4 text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none relative">
            Governance
            {activeRemovals.length > 0 && (
              <span className="absolute -top-1 -right-4 bg-foreground text-background text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {activeRemovals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="bg-transparent border-none p-0 pb-4 text-sm data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none">
            Audit Trail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roster">
          <UnitRoster 
            members={members} 
            unitId={unit.id} 
            currentUserRole={userRole} 
            currentUserId={session.userId} 
            removalTargetIds={removalTargetIds}
          />
        </TabsContent>

        <TabsContent value="requests">
          <UnitJoinRequests requests={pendingRequests} />
        </TabsContent>

        <TabsContent value="governance">
          <UnitGovernance 
            activeRemovals={activeRemovals} 
            coolingRemovals={coolingRemovals}
            unitId={unit.id} 
            currentUserId={session.userId}
            currentUserRole={userRole}
            isCooling={!!userOffboarding}
          />
        </TabsContent>

        <TabsContent value="audit">
          <UnitAuditLogView logs={auditLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
