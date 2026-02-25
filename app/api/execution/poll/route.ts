import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h || typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

async function validateAgentBearer(agentInstanceId: string, bearerToken: string): Promise<boolean> {
  const instance = await prisma.agentInstance.findUnique({
    where: { id: agentInstanceId },
    select: { authTokenRef: true },
  });
  if (!instance?.authTokenRef?.trim()) return false;
  const secret = process.env[instance.authTokenRef.trim()];
  return typeof secret === "string" && secret.length > 0 && secret === bearerToken;
}

type PollBody = { agentInstanceId?: string };

/**
 * POST /api/execution/poll — Worker pulls next PENDING job. Bearer auth (token from AgentInstance.authTokenRef).
 * Body: { agentInstanceId }. Returns job payload or 204 if none.
 */
export async function POST(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: PollBody;
  try {
    body = (await req.json()) as PollBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const agentInstanceId = body.agentInstanceId?.trim();
  if (!agentInstanceId) {
    return NextResponse.json({ error: "agentInstanceId required" }, { status: 400 });
  }

  const valid = await validateAgentBearer(agentInstanceId, token);
  if (!valid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const LEASE_TIMEOUT_MS = 5 * 60 * 1000; // 5 min
  const stale = new Date(Date.now() - LEASE_TIMEOUT_MS);
  await prisma.executionJob.updateMany({
    where: { agentInstanceId, status: "RUNNING", updatedAt: { lt: stale } },
    data: { status: "PENDING", updatedAt: new Date() },
  });

  const job = await prisma.executionJob.findFirst({
    where: { agentInstanceId, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { id: true, orgId: true, actorRole: true, messageText: true },
  });

  if (!job) {
    return new NextResponse(null, { status: 204 });
  }

  await prisma.executionJob.update({
    where: { id: job.id },
    data: { status: "RUNNING", updatedAt: new Date() },
  });

  return NextResponse.json({
    jobId: job.id,
    correlationId: job.id,
    orgId: job.orgId,
    actorRole: job.actorRole,
    messageText: job.messageText,
  });
}
