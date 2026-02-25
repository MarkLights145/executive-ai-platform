import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

/**
 * GET /api/execution/agent-instances — List agent instances for caller's org (admin only).
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

  const list = await prisma.agentInstance.findMany({
    where: { orgId: user.organizationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      baseUrl: true,
      authType: true,
      authTokenRef: true,
      enabled: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ instances: list });
}

/**
 * POST /api/execution/agent-instances — Create agent instance (admin only).
 * Body: { name, baseUrl, authTokenRef }
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

  let body: { name?: string; baseUrl?: string; authTokenRef?: string };
  try {
    body = (await req.json()) as { name?: string; baseUrl?: string; authTokenRef?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const baseUrl = body.baseUrl?.trim();
  const authTokenRef = body.authTokenRef?.trim();
  if (!name || !baseUrl || !authTokenRef) {
    return NextResponse.json(
      { error: "name, baseUrl, and authTokenRef are required" },
      { status: 400 }
    );
  }

  const agent = await prisma.agentInstance.create({
    data: {
      orgId: user.organizationId,
      name,
      baseUrl,
      authType: "BEARER",
      authTokenRef,
      enabled: true,
    },
    select: {
      id: true,
      name: true,
      baseUrl: true,
      authType: true,
      authTokenRef: true,
      enabled: true,
      createdAt: true,
    },
  });
  return NextResponse.json(agent, { status: 200 });
}
