-- Add referral system fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredBy" TEXT;

-- Create unique index on referralCode
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");

-- Create Referral table
CREATE TABLE IF NOT EXISTS "Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "creditsAwarded" BOOLEAN NOT NULL DEFAULT false,
    "awardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for Referral table
CREATE UNIQUE INDEX IF NOT EXISTS "Referral_referrerId_referredId_key" ON "Referral"("referrerId", "referredId");
CREATE INDEX IF NOT EXISTS "Referral_referrerId_idx" ON "Referral"("referrerId");
CREATE INDEX IF NOT EXISTS "Referral_referredId_idx" ON "Referral"("referredId");
CREATE INDEX IF NOT EXISTS "Referral_status_idx" ON "Referral"("status");
CREATE INDEX IF NOT EXISTS "Referral_creditsAwarded_idx" ON "Referral"("creditsAwarded");
