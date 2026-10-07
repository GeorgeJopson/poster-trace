CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poster" (
	"id" serial PRIMARY KEY,
	"activated" boolean NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"poster_design_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poster_campaign" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"target" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poster_design" (
	"id" serial PRIMARY KEY,
	"design" bytea NOT NULL,
	"design_mime_type" text NOT NULL,
	"qr_x_position" double precision NOT NULL,
	"qr_y_position" double precision NOT NULL,
	"qr_size" double precision NOT NULL,
	"qr_rotation" double precision NOT NULL,
	"poster_campaign_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan" (
	"id" serial PRIMARY KEY,
	"time" timestamp DEFAULT now() NOT NULL,
	"poster_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_user_id_index" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "poster_poster_design_id_index" ON "poster" ("poster_design_id");--> statement-breakpoint
CREATE INDEX "poster_campaign_user_id_index" ON "poster_campaign" ("user_id");--> statement-breakpoint
CREATE INDEX "poster_design_poster_campaign_id_index" ON "poster_design" ("poster_campaign_id");--> statement-breakpoint
CREATE INDEX "scan_poster_id_index" ON "scan" ("poster_id");--> statement-breakpoint
CREATE INDEX "session_user_id_index" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_index" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "poster" ADD CONSTRAINT "poster_poster_design_id_poster_design_id_fkey" FOREIGN KEY ("poster_design_id") REFERENCES "poster_design"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "poster_campaign" ADD CONSTRAINT "poster_campaign_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "poster_design" ADD CONSTRAINT "poster_design_poster_campaign_id_poster_campaign_id_fkey" FOREIGN KEY ("poster_campaign_id") REFERENCES "poster_campaign"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "scan" ADD CONSTRAINT "scan_poster_id_poster_id_fkey" FOREIGN KEY ("poster_id") REFERENCES "poster"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;