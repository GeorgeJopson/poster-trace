-- Hand-written, as Postgres can't cast integer ids to UUIDs. Scans move to
-- UUIDs the domain generates, and "time" becomes "scanned_at" with no
-- default, as the domain says when each scan happened (see ADR-0015). The
-- scan table is dropped and recreated: this DISCARDS ALL SCANS. There are
-- none yet, as nothing has recorded them.
DROP TABLE "scan";--> statement-breakpoint
CREATE TABLE "scan" (
	"id" uuid PRIMARY KEY,
	"scanned_at" timestamp NOT NULL,
	"poster_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE INDEX "scan_poster_id_index" ON "scan" ("poster_id");--> statement-breakpoint
ALTER TABLE "scan" ADD CONSTRAINT "scan_poster_id_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "poster"("id") ON DELETE CASCADE;
