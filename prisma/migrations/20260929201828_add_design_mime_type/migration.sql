-- AlterTable
-- Existing designs were all stored as PNGs, so backfill them with image/png
-- and then drop the default so new rows must provide a MIME type.
ALTER TABLE "PosterDesign" ADD COLUMN "designMimeType" TEXT NOT NULL DEFAULT 'image/png';
ALTER TABLE "PosterDesign" ALTER COLUMN "designMimeType" DROP DEFAULT;
