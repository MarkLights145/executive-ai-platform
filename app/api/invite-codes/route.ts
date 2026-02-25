import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { randomBytes } from "crypto";

const CODE_LENGTH = 8;
const CODE_EXPIRY_DAYS = 7;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(CODE_LENGTH);
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[bytes[i]! % chars.length];
  }
  return code;
}

/**
 * POST /api/invite-codes — Create invite code (admin only)
 * Optional query param: ?role=ADMIN to create an admin invite.
 */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestedRole = searchParams.get("role")?.trim().toUpperCase() === "ADMIN" ? "ADMIN" : "USER";
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;
  if (!user?.organizationId || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + CODE_EXPIRY_DAYS);

  let code: string;
  for (let attempt = 0; attempt < 10; attempt++) {
    code = generateCode();
    const existing = await prisma.inviteCode.findUnique({ where: { code } });
    if (!existing) break;
  }
  code ??= generateCode();

  const invite = await prisma.inviteCode.create({
    data: {
      code,
      role: requestedRole,
      organizationId: user.organizationId,
      expiresAt,
    },
    include: { organization: { select: { name: true } } },
  });

  return NextResponse.json({
    code: invite.code,
    role: invite.role,
    expiresAt: invite.expiresAt.toISOString(),
    organizationName: invite.organization.name,
  });
}

/**
 * GET /api/invite-codes?code=XXX — Validate code (public, for signup page)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false, error: "Missing code" }, { status: 400 });
  }

  const invite = await prisma.inviteCode.findUnique({
    where: { code },
    include: { organization: { select: { name: true } } },
  });

  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invalid code" });
  }
  if (invite.usedAt) {
    return NextResponse.json({ valid: false, error: "Code already used" });
  }
  if (new Date() > invite.expiresAt) {
    return NextResponse.json({ valid: false, error: "Code expired" });
  }

  return NextResponse.json({
    valid: true,
    organizationName: invite.organization.name,
  });
}
