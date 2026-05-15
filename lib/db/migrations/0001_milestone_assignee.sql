CREATE TYPE "public"."milestone_assignee" AS ENUM('team', 'client');--> statement-breakpoint
ALTER TABLE "milestones" ADD COLUMN "assigned_to" "milestone_assignee" DEFAULT 'team' NOT NULL;
