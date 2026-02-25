import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

type CreateJobBody = {
  orgId: string;
  agentInstanceId: string;
  actorRole: string;
  messageText: string;
};

/**
 * POST /api/execution/jobs — Create execution job (admin only). Returns { jobId }.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  let body: CreateJobBody;
  try {
    body = (await req.json()) as CreateJobBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { orgId, agentInstanceId, actorRole, messageText } = body;
  if (!orgId || !agentInstanceId || typeof messageText !== "string") {
    return NextResponse.json(
      { error: "orgId, agentInstanceId, and messageText are required" },
      { status: 400 }
    );
  }

  if (orgId !== user.organizationId) {
    return NextResponse.json({ error: "Forbidden: org mismatch" }, { status: 403 });
  }

  const instance = await prisma.agentInstance.findFirst({
    where: { id: agentInstanceId, orgId, enabled: true },
  });
  if (!instance) {
    return NextResponse.json({ error: "Agent instance not found or disabled" }, { status: 404 });
  }

  const job = await prisma.executionJob.create({
    data: {
      orgId,
      agentInstanceId,
      actorRole: actorRole?.trim() || "ADMIN",
      messageText,
      status: "PENDING",
    },
    select: { id: true },
  });

  return NextResponse.json({ jobId: job.id }, { status: 200 });
}
