ALTER TABLE "poster_design" ADD COLUMN "design_image_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "poster_design" DROP COLUMN "design";--> statement-breakpoint
ALTER TABLE "poster_design" DROP COLUMN "design_mime_type";