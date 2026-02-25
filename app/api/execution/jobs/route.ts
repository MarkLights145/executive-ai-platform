import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { isAllowedUserMessage } from "@/app/lib/rolePolicy";
import { sendEscalationNotification } from "@/app/lib/email";

type CreateJobBody = {
  orgId: string;
  agentInstanceId: string;
  actorRole: string;
  messageText: string;
};

type SessionUser = { id?: string; role?: string; organizationId?: string };

/**
 * POST /api/execution/jobs — Create execution job. Admin: any message. User: only status/ETA/progress; else escalation.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser | undefined;

  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const isAdmin = user.role === "ADMIN";
  if (!isAdmin) {
    if (!isAllowedUserMessage(messageText)) {
      const escalation = await prisma.escalation.create({
        data: {
          orgId: user.organizationId,
          userId: user.id ?? "",
          messageText,
          reason: "OFF_SCRIPT",
          status: "OPEN",
        },
        select: { id: true },
      });
      const admins = await prisma.user.findMany({
        where: { organizationId: user.organizationId, role: "ADMIN" },
        select: { email: true },
      });
      const toEmails = admins.map((u) => u.email).filter((e): e is string => !!e?.trim());
      sendEscalationNotification(toEmails, {
        escalationId: escalation.id,
        messageText,
        reason: "OFF_SCRIPT",
      }).catch(() => {});
      return NextResponse.json(
        { error: "Message escalated", escalationId: escalation.id },
        { status: 403 }
      );
    }
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
      actorRole: (actorRole?.trim() || (isAdmin ? "ADMIN" : "USER")),
      messageText,
      status: "PENDING",
    },
    select: { id: true },
  });

  return NextResponse.json({ jobId: job.id }, { status: 200 });
}
