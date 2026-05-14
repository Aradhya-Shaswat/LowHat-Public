/**
 * Seeding with Neon Auth
 * 
 * User creation is now fully managed by Neon Auth (Better Auth).
 * You cannot directly insert into the `neon_auth.user` table programmatically.
 * 
 * To seed the database:
 * 1. Start the app with `bun dev`
 * 2. Create accounts via the /signup page (each role: client, freelancer, admin)
 * 3. Run this script to create supplementary data (teams, jobs, bids) for existing users
 * 
 * Usage: bun run lib/db/seed.ts
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Starting supplementary seed...\n");

  // Fetch existing users from Neon Auth
  const allUsers = await db.select().from(schema.users);
  
  if (allUsers.length === 0) {
    console.log("⚠️  No users found. Create accounts via /signup first, then re-run this script.");
    process.exit(0);
  }

  console.log(`Found ${allUsers.length} users:`);
  allUsers.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.role || 'no role'}]`));

  const freelancers = allUsers.filter(u => u.role === "freelancer");
  const clients = allUsers.filter(u => u.role === "client");

  // Create a team for the first freelancer
  if (freelancers.length > 0) {
    const existing = await db.select().from(schema.teams);
    if (existing.length === 0) {
      console.log("\n📦 Creating demo team...");
      const [team] = await db.insert(schema.teams).values({
        name: "Apex Backend Ops",
        description: "High-velocity backend engineering and infrastructure. Specializing in Go, Rust, and distributed systems.",
      }).returning();

      // Add all freelancers to the team
      for (const fl of freelancers) {
        await db.insert(schema.teamMembers).values({
          teamId: team.id,
          userId: fl.id,
          teamRole: fl.id === freelancers[0].id ? "owner" : "member",
        });
      }
      console.log(`  ✓ Team "${team.name}" created with ${freelancers.length} members`);
    } else {
      console.log("\n📦 Teams already exist, skipping.");
    }
  }

  // Create demo jobs for the first client
  if (clients.length > 0) {
    const existingJobs = await db.select().from(schema.jobs);
    if (existingJobs.length === 0) {
      console.log("\n📋 Creating demo jobs...");
      const client = clients[0];

      await db.insert(schema.jobs).values([
        {
          clientId: client.id,
          title: "Migrate Payment Infrastructure to Stripe Connect",
          description: "Seeking a high-caliber team to migrate our existing payment flows from a legacy processor to Stripe Connect. Must handle split payments, multi-party payouts, and compliance checks. Target timeline: 6 weeks.",
          budgetMin: 800000, // $8,000
          budgetMax: 1500000, // $15,000
          status: "open",
        },
        {
          clientId: client.id,
          title: "Build Real-Time Analytics Dashboard",
          description: "We need a performant, real-time analytics dashboard built with WebSockets and server-sent events. Must handle 10k+ concurrent users. Tech stack: Next.js frontend, Go backend. Include comprehensive test coverage.",
          budgetMin: 500000, // $5,000
          budgetMax: 1200000, // $12,000
          status: "open",
        },
      ]);
      console.log("  ✓ Created 2 demo jobs");
    } else {
      console.log("\n📋 Jobs already exist, skipping.");
    }
  }

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});