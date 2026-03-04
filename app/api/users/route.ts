import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { requireAuth, auditLog } from "@/app/lib/api-auth";

/**
 * GET /api/users — Org-scoped user list. Service account requires scope "users:read".
 */
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  if (auth.principalType === "service_account") {
    const scopes = auth.scopes ?? [];
    if (!scopes.includes("users:read")) {
      return NextResponse.json({ error: "Forbidden: users:read scope required" }, { status: 403 });
    }
  }

  const users = await prisma.user.findMany({
    where: { organizationId: auth.orgId },
    select: {
      id: true,
      name: true,
      email: true,
      telegramUsername: true,
      telegramUserId: true,
      role: true,
    },
    orderBy: { email: "asc" },
  });

  await auditLog({
    orgId: auth.orgId,
    principalId: auth.principalId,
    principalType: auth.principalType,
    route: "/api/users",
    method: "GET",
    status: 200,
  });

  return NextResponse.json({ users });
}
