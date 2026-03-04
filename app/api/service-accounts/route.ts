import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { hashToken, auditLog } from "@/app/lib/api-auth";
import { randomBytes } from "crypto";

/**
 * POST /api/service-accounts — Create service account (admin only, session auth).
 * Body: { name, scopes: string[] }. Returns one-time plaintext token (only in this response).
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; organizationId?: string } | undefined;

  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
  }

  let body: { name?: string; scopes?: string[] };
  try {
    body = (await req.json()) as { name?: string; scopes?: string[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const scopes = Array.isArray(body.scopes) ? body.scopes : [];
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const oneTimeToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(oneTimeToken);

  const sa = await prisma.serviceAccount.create({
    data: {
      orgId: user.organizationId,
      name,
      tokenHash,
      scopes,
      isActive: true,
    },
    select: { id: true, name: true, scopes: true, createdAt: true },
  });

  await auditLog({
    orgId: user.organizationId,
    principalId: user.id ?? "",
    principalType: "user",
    route: "/api/service-accounts",
    method: "POST",
    status: 200,
  });

  return NextResponse.json({
    id: sa.id,
    name: sa.name,
    scopes: sa.scopes,
    createdAt: sa.createdAt,
    token: oneTimeToken,
  });
}
