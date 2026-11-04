-- Hand-written, as Postgres can't cast integer ids to UUIDs. Posters move to
-- UUIDs the domain generates and lose activated/latitude/longitude (a
-- poster's location will live in its own table once it's registered). The
-- poster and scan tables are dropped and recreated: this DISCARDS ALL POSTERS
-- AND SCANS. There are none yet.
DROP TABLE "scan";--> statement-breakpoint
DROP TABLE "poster";--> statement-breakpoint
CREATE TABLE "poster" (
	"id" uuid PRIMARY KEY,
	"poster_design_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan" (
	"id" serial PRIMARY KEY,
	"time" timestamp DEFAULT now() NOT NULL,
	"poster_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE INDEX "poster_poster_design_id_index" ON "poster" ("poster_design_id");--> statement-breakpoint
CREATE INDEX "scan_poster_id_index" ON "scan" ("poster_id");--> statement-breakpoint
ALTER TABLE "poster" ADD CONSTRAINT "poster_poster_design_id_poster_design_id_fkey" FOREIGN KEY ("poster_design_id") REFERENCES "poster_design"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scan" ADD CONSTRAINT "scan_poster_id_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "poster"("id") ON DELETE CASCADE;
