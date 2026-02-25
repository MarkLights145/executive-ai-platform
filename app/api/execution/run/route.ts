import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export type ExecutionRunBody = {
  orgId: string;
  agentInstanceId: string;
  actorRole: string;
  messageText: string;
};

/**
 * POST /api/execution/run
 * Forward run request to an org's agent instance. Caller must be org ADMIN.
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

  let body: ExecutionRunBody;
  try {
    body = (await req.json()) as ExecutionRunBody;
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

  const agent = await prisma.agentInstance.findFirst({
    where: { id: agentInstanceId, orgId, enabled: true },
  });
  if (!agent) {
    return NextResponse.json({ error: "Agent instance not found or disabled" }, { status: 404 });
  }

  const tokenRef = agent.authTokenRef?.trim();
  if (!tokenRef) {
    return NextResponse.json({ error: "Agent authTokenRef not configured" }, { status: 500 });
  }
  const token = process.env[tokenRef];
  if (!token) {
    return NextResponse.json({ error: "Agent token not available" }, { status: 500 });
  }

  const baseUrl = agent.baseUrl.replace(/\/$/, "");
  const runUrl = `${baseUrl}/run`;

  try {
    const res = await fetch(runUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        orgId,
        agentInstanceId,
        actorRole: actorRole ?? "admin",
        messageText,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Agent request failed", status: res.status },
        { status: res.status >= 400 && res.status < 500 ? res.status : 502 }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("execution run error", message);
    return NextResponse.json({ error: "Agent request failed" }, { status: 502 });
  }
}
