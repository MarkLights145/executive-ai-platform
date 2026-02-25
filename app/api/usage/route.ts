import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
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

type UsageBody = {
  orgId: string;
  jobId?: string;
  inputTokens?: number;
  outputTokens?: number;
  costEstimateCents?: number;
};

/**
 * POST /api/usage — Record usage (worker with bearer, or admin). Never log key values.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;
  const bearer = getBearerToken(req);
  const isAdmin = user?.role === "ADMIN" && user?.organizationId;

  let body: UsageBody;
  try {
    body = (await req.json()) as UsageBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { orgId, jobId, inputTokens = 0, outputTokens = 0, costEstimateCents } = body;
  if (!orgId || typeof inputTokens !== "number" || typeof outputTokens !== "number") {
    return NextResponse.json(
      { error: "orgId, inputTokens, outputTokens required" },
      { status: 400 }
    );
  }

  if (isAdmin && orgId === user.organizationId) {
    await prisma.usageLog.create({
      data: {
        orgId,
        jobId: jobId ?? null,
        inputTokens,
        outputTokens,
        costEstimateCents: costEstimateCents ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (bearer && jobId) {
    const job = await prisma.executionJob.findUnique({
      where: { id: jobId },
      select: { orgId: true, agentInstanceId: true },
    });
    if (!job || job.orgId !== orgId) {
      return NextResponse.json({ error: "Job not found or org mismatch" }, { status: 404 });
    }
    const valid = await validateAgentBearer(job.agentInstanceId, bearer);
    if (!valid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.usageLog.create({
      data: {
        orgId,
        jobId,
        inputTokens,
        outputTokens,
        costEstimateCents: costEstimateCents ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * GET /api/usage — List usage for caller's org (admin only). Never return key values.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const logs = await prisma.usageLog.findMany({
    where: { orgId: user.organizationId },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      jobId: true,
      inputTokens: true,
      outputTokens: true,
      costEstimateCents: true,
      createdAt: true,
    },
  });

  const summary = {
    totalInputTokens: logs.reduce((s, l) => s + l.inputTokens, 0),
    totalOutputTokens: logs.reduce((s, l) => s + l.outputTokens, 0),
    totalCostCents: logs.reduce((s, l) => s + (l.costEstimateCents ?? 0), 0),
    count: logs.length,
  };

  return NextResponse.json({ usage: logs, summary });
}
