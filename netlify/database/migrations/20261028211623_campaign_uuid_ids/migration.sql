-- Hand-written (see architecture-redesign/infrastructure/README.md#migration).
-- Campaigns and designs move from serial ids to UUIDs the domain generates,
-- and poster_campaign becomes campaign. Postgres can't cast integer ids to
-- UUIDs, so the poster tables are dropped and recreated: this DISCARDS ALL
-- CAMPAIGNS, DESIGNS, POSTERS AND SCANS. Users and their sign-ins are kept.
DROP TABLE "scan";--> statement-breakpoint
DROP TABLE "poster";--> statement-breakpoint
DROP TABLE "poster_design";--> statement-breakpoint
DROP TABLE "poster_campaign";--> statement-breakpoint
CREATE TABLE "campaign" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"target" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poster_design" (
	"id" uuid PRIMARY KEY,
	"design_image_key" text NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"size" double precision NOT NULL,
	"rotation" double precision NOT NULL,
	"campaign_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poster" (
	"id" serial PRIMARY KEY,
	"activated" boolean NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"poster_design_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan" (
	"id" serial PRIMARY KEY,
	"time" timestamp DEFAULT now() NOT NULL,
	"poster_id" integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX "campaign_user_id_index" ON "campaign" ("user_id");--> statement-breakpoint
CREATE INDEX "poster_design_campaign_id_index" ON "poster_design" ("campaign_id");--> statement-breakpoint
CREATE INDEX "poster_poster_design_id_index" ON "poster" ("poster_design_id");--> statement-breakpoint
CREATE INDEX "scan_poster_id_index" ON "scan" ("poster_id");--> statement-breakpoint
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "poster_design" ADD CONSTRAINT "poster_design_campaign_id_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaign"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "poster" ADD CONSTRAINT "poster_poster_design_id_poster_design_id_fkey" FOREIGN KEY ("poster_design_id") REFERENCES "poster_design"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scan" ADD CONSTRAINT "scan_poster_id_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "poster"("id") ON DELETE CASCADE;
