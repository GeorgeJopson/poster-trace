CREATE TABLE "registration" (
	"poster_id" uuid PRIMARY KEY,
	"poster_name" text NOT NULL,
	"registered_at" timestamp NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"accuracy" double precision,
	CONSTRAINT "registration_location_all_or_none" CHECK (("latitude" IS NULL) = ("longitude" IS NULL) AND ("latitude" IS NULL) = ("accuracy" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_poster_id_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "poster"("id") ON DELETE CASCADE;