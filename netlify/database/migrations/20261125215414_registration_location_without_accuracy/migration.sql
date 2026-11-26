ALTER TABLE "registration" DROP CONSTRAINT "registration_location_all_or_none", ADD CONSTRAINT "registration_location_all_or_none" CHECK (("latitude" IS NULL) = ("longitude" IS NULL));--> statement-breakpoint
ALTER TABLE "registration" DROP COLUMN "accuracy";
