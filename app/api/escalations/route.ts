import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

/**
 * GET /api/escalations — List escalations for caller's org (admin only).
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

  const list = await prisma.escalation.findMany({
    where: { orgId: user.organizationId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      messageText: true,
      reason: true,
      status: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ escalations: list });
}
