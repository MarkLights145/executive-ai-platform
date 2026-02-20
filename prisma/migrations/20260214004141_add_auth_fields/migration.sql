-- AlterTable
ALTER TABLE "User" ADD COLUMN     "featureRequest" TEXT,
ADD COLUMN     "onboardingPreferences" JSONB,
ADD COLUMN     "passwordHash" TEXT;
