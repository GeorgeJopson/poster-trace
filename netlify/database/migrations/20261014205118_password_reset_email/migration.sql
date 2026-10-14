CREATE TABLE "password_reset_email" (
	"user_id" text PRIMARY KEY,
	"sent_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_reset_email" ADD CONSTRAINT "password_reset_email_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;