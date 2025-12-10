-- Add tags column to ImageProject table
ALTER TABLE "ImageProject" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
