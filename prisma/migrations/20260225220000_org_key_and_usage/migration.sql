-- AlterTable
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "openaiKeyRef" TEXT;

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "jobId" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costEstimateCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
