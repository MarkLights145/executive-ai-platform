import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

/**
 * GET /api/org — Get current org (admin). Never return secret values; openaiKeyRef is the env var name only.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: { id: true, name: true, openaiKeyRef: true },
  });
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }
  return NextResponse.json(org);
}

/**
 * PATCH /api/org — Update org (admin). Body: { openaiKeyRef? }. Never store or return key values.
 */
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  let body: { openaiKeyRef?: string };
  try {
    body = (await req.json()) as { openaiKeyRef?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const openaiKeyRef = body.openaiKeyRef?.trim();
  const data = openaiKeyRef !== undefined
    ? { openaiKeyRef: openaiKeyRef === "" ? null : openaiKeyRef }
    : {};

  const org = await prisma.organization.update({
    where: { id: user.organizationId },
    data,
    select: { id: true, name: true, openaiKeyRef: true },
  });
  return NextResponse.json(org);
}
