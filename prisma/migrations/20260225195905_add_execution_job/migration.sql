-- CreateEnum
CREATE TYPE "ExecutionJobStatus" AS ENUM ('PENDING', 'RUNNING', 'DONE', 'ERROR');

-- CreateTable
CREATE TABLE "ExecutionJob" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "agentInstanceId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "status" "ExecutionJobStatus" NOT NULL DEFAULT 'PENDING',
    "resultText" TEXT,
    "errorText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionJob_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExecutionJob" ADD CONSTRAINT "ExecutionJob_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionJob" ADD CONSTRAINT "ExecutionJob_agentInstanceId_fkey" FOREIGN KEY ("agentInstanceId") REFERENCES "AgentInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
