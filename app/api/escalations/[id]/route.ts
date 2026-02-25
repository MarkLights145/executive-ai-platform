import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

/**
 * PATCH /api/escalations/[id] — Update escalation status (admin, same org).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  let body: { status?: string };
  try {
    body = (await req.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const status = body.status?.toUpperCase();
  if (!status || !["OPEN", "ACKNOWLEDGED", "RESOLVED"].includes(status)) {
    return NextResponse.json({ error: "status must be OPEN, ACKNOWLEDGED, or RESOLVED" }, { status: 400 });
  }

  const escalation = await prisma.escalation.findFirst({
    where: { id, orgId: user.organizationId },
  });
  if (!escalation) {
    return NextResponse.json({ error: "Escalation not found" }, { status: 404 });
  }

  await prisma.escalation.update({
    where: { id },
    data: { status: status as "OPEN" | "ACKNOWLEDGED" | "RESOLVED" },
  });
  return NextResponse.json({ ok: true, status });
}
