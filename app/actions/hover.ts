"use server";

import { db } from "@/lib/db";
import { teams, teamMembers, bids, reviews, users, freelancerProfiles, clientProfiles } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getUnitHoverInfo(identifier: string) {
  try {
    let team = null;
    
    try {
      const results = await db.select().from(teams).where(eq(teams.id, identifier)).limit(1);
      if (results.length > 0) {
        team = results[0];
      }
    } catch (e) {
    }
    
    if (!team) {
      const results = await db.select().from(teams).where(eq(teams.name, identifier)).limit(1);
      if (results.length > 0) {
        team = results[0];
      }
    }
    
    if (!team) {
      return null;
    }
    
    const membersCountRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(teamMembers)
      .where(eq(teamMembers.teamId, team.id));
    const memberCount = Number(membersCountRes[0]?.count || 0);
    
    const activeBidsRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(bids)
      .where(and(eq(bids.teamId, team.id), eq(bids.status, 'pending')));
    const activeBids = Number(activeBidsRes[0]?.count || 0);
    
    const reviewsRes = await db
      .select({ 
        avgRating: sql<number>`avg(rating)`,
        count: sql<number>`count(*)`
      })
      .from(reviews)
      .where(eq(reviews.revieweeTeamId, team.id));
      
    const avgRating = reviewsRes[0]?.avgRating ? Number(reviewsRes[0].avgRating).toFixed(1) : "5.0";
    const reviewsCount = Number(reviewsRes[0]?.count || 0);

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt.toISOString(),
      memberCount,
      activeBids,
      reputation: `${avgRating}/5.0`,
      reviewsCount
    };
  } catch (error) {
    console.error("Error in getUnitHoverInfo:", error);
    return null;
  }
}

export async function getFreelancerHoverInfo(identifier: string) {
  try {
    let user = null;
    
    try {
      const results = await db.select().from(users).where(eq(users.id, identifier)).limit(1);
      if (results.length > 0) {
        user = results[0];
      }
    } catch (e) {

    }
    
    if (!user) {
      const results = await db.select().from(users).where(eq(users.name, identifier)).limit(1);
      if (results.length > 0) {
        user = results[0];
      }
    }
    
    if (!user) {
      return null;
    }
    
    let freelancerProfile = null;
    let clientProfile = null;

    if (user.role === 'client') {
      const [cp] = await db
        .select()
        .from(clientProfiles)
        .where(eq(clientProfiles.userId, user.id))
        .limit(1);
      clientProfile = cp;
    } else {
      const [fp] = await db
        .select()
        .from(freelancerProfiles)
        .where(eq(freelancerProfiles.userId, user.id))
        .limit(1);
      freelancerProfile = fp;
    }
      
    const tm = await db
      .select({ teamName: teams.name, teamId: teams.id })
      .from(teamMembers)
      .leftJoin(teams, eq(teamMembers.teamId, teams.id))
      .where(eq(teamMembers.userId, user.id))
      .limit(1);
      
    const unit = tm.length > 0 ? tm[0] : null;
    
    const reviewsRes = await db
      .select({ 
        avgRating: sql<number>`avg(rating)`,
        count: sql<number>`count(*)`
      })
      .from(reviews)
      .where(eq(reviews.revieweeId, user.id));
      
    const avgRating = reviewsRes[0]?.avgRating ? Number(reviewsRes[0].avgRating).toFixed(1) : "5.0";
    const reviewsCount = Number(reviewsRes[0]?.count || 0);
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "freelancer",
      title: user.role === 'client' ? (clientProfile?.companyName || "Client") : (freelancerProfile?.title || "Independent Professional"),
      bio: freelancerProfile?.bio || null,
      hourlyRate: freelancerProfile?.hourlyRate ? freelancerProfile.hourlyRate / 100 : null,
      createdAt: user.createdAt.toISOString(),
      unitName: unit?.teamName || null,
      unitId: unit?.teamId || null,
      reputation: `${avgRating}/5.0`,
      reviewsCount,
      companyName: clientProfile?.companyName || null,
      industry: clientProfile?.industry || null
    };
  } catch (error) {
    console.error("Error in getFreelancerHoverInfo:", error);
    return null;
  }
}
