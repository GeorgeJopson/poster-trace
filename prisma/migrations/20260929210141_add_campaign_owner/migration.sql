-- Existing campaigns have no owner and aren't worth keeping, so wipe all
-- poster data (children first) before adding the required owner column.
DELETE FROM "Scan";
DELETE FROM "Poster";
DELETE FROM "PosterDesign";
DELETE FROM "PosterCampaign";

-- AlterTable
ALTER TABLE "PosterCampaign" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "PosterCampaign_userId_idx" ON "PosterCampaign"("userId");

-- AddForeignKey
ALTER TABLE "PosterCampaign" ADD CONSTRAINT "PosterCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
