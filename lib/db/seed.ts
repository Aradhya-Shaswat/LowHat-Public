import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Starting supplementary seed...\n");

  const allUsers = await db.select().from(schema.users);
  
  if (allUsers.length === 0) {
    console.log("⚠️  No users found. Create accounts via /signup first, then re-run this script.");
    process.exit(0);
  }

  console.log(`Found ${allUsers.length} users:`);
  allUsers.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.role || 'no role'}]`));

  const freelancers = allUsers.filter(u => u.role === "freelancer");
  const clients = allUsers.filter(u => u.role === "client");

  if (freelancers.length > 0) {
    const existing = await db.select().from(schema.teams);
    if (existing.length === 0) {
      console.log("\n📦 Creating demo team...");
      const [team] = await db.insert(schema.teams).values({
        name: "Apex Backend Ops",
        description: "High-velocity backend engineering and infrastructure. Specializing in Go, Rust, and distributed systems.",
      }).returning();

      for (const fl of freelancers) {
        await db.insert(schema.teamMembers).values({
          teamId: team.id,
          userId: fl.id,
          teamRole: fl.id === freelancers[0].id ? "owner" : "member",
        });
      }
      console.log(`  ✓ Team "${team.name}" created with ${freelancers.length} members`);
    }
  }

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
          budgetMin: 800000,
          budgetMax: 1500000,
          status: "open",
        },
        {
          clientId: client.id,
          title: "Build Real-Time Analytics Dashboard",
          description: "We need a performant, real-time analytics dashboard built with WebSockets and server-sent events. Must handle 10k+ concurrent users. Tech stack: Next.js frontend, Go backend. Include comprehensive test coverage.",
          budgetMin: 500000,
          budgetMax: 1200000,
          status: "open",
        },
      ]);
      console.log("  ✓ Created 2 demo jobs");
    }
  }

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});