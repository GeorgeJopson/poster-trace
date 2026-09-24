-- CreateTable
CREATE TABLE "PosterCampaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "target" TEXT NOT NULL,

    CONSTRAINT "PosterCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosterDesign" (
    "id" SERIAL NOT NULL,
    "design" BYTEA NOT NULL,
    "qr_x_position" DOUBLE PRECISION NOT NULL,
    "qr_y_position" DOUBLE PRECISION NOT NULL,
    "qr_size" DOUBLE PRECISION NOT NULL,
    "qr_rotation" DOUBLE PRECISION NOT NULL,
    "posterCampaignId" INTEGER NOT NULL,

    CONSTRAINT "PosterDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poster" (
    "id" SERIAL NOT NULL,
    "activated" BOOLEAN NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "posterDesignId" INTEGER NOT NULL,

    CONSTRAINT "Poster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" SERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posterId" INTEGER NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PosterDesign" ADD CONSTRAINT "PosterDesign_posterCampaignId_fkey" FOREIGN KEY ("posterCampaignId") REFERENCES "PosterCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poster" ADD CONSTRAINT "Poster_posterDesignId_fkey" FOREIGN KEY ("posterDesignId") REFERENCES "PosterDesign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_posterId_fkey" FOREIGN KEY ("posterId") REFERENCES "Poster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
