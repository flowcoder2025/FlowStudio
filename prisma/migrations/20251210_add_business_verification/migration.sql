-- AlterTable: Add business verification fields to User
ALTER TABLE "User" ADD COLUMN     "businessNumber" TEXT,
ADD COLUMN     "businessOwnerName" TEXT,
ADD COLUMN     "businessPhone" TEXT,
ADD COLUMN     "businessVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "businessVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "businessBonusClaimed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: Create unique index on businessNumber
CREATE UNIQUE INDEX "User_businessNumber_key" ON "User"("businessNumber");

-- CreateIndex: Create index on businessNumber for faster lookups
CREATE INDEX "User_businessNumber_idx" ON "User"("businessNumber");
