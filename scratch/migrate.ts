import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    await db.execute(sql`CREATE TYPE "public"."milestone_status" AS ENUM('pending', 'in_progress', 'completed');`);
    console.log("Created enum");
  } catch(e) {}
  try {
    await db.execute(sql`ALTER TABLE "milestones" ADD COLUMN "status" "milestone_status" DEFAULT 'pending' NOT NULL;`);
    console.log("Added status column");
  } catch(e) {}
  try {
    await db.execute(sql`UPDATE "milestones" SET "status" = 'completed' WHERE "is_completed" = true;`);
    console.log("Migrated data");
  } catch(e) {}
  try {
    await db.execute(sql`ALTER TABLE "milestones" DROP COLUMN "is_completed";`);
    console.log("Dropped is_completed column");
  } catch(e) {}

  process.exit(0);
}

run();
