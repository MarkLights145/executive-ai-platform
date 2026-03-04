import { createHash } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

export type ApiAuth =
  | { principalType: "user"; principalId: string; orgId: string; scopes?: string[] }
  | { principalType: "service_account"; principalId: string; orgId: string; scopes: string[] };

function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h || typeof h !== "string") return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Resolve auth from request: Bearer token (service account) or session (user).
 * Returns auth context or null if unauthenticated.
 */
export async function getApiAuth(req: Request): Promise<ApiAuth | null> {
  const bearer = getBearerToken(req);
  if (bearer) {
    const tokenHash = hashToken(bearer);
    const sa = await prisma.serviceAccount.findFirst({
      where: { tokenHash, isActive: true },
      select: { id: true, orgId: true, scopes: true },
    });
    if (!sa) return null;
    const scopes = Array.isArray(sa.scopes) ? (sa.scopes as string[]) : [];
    return {
      principalType: "service_account",
      principalId: sa.id,
      orgId: sa.orgId,
      scopes,
    };
  }
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; organizationId?: string; role?: string } | undefined;
  if (!user?.id || !user?.organizationId) return null;
  return {
    principalType: "user",
    principalId: user.id,
    orgId: user.organizationId,
    scopes: undefined,
  };
}

/**
 * Require auth; returns auth or the 401 Response to return.
 */
export async function requireAuth(req: Request): Promise<ApiAuth | Response> {
  const auth = await getApiAuth(req);
  if (!auth)
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  return auth;
}

/**
 * Require admin (user with role ADMIN). Use after requireAuth when route is admin-only.
 * Returns 403 Response or null.
 */
export async function requireAdmin(auth: ApiAuth): Promise<Response | null> {
  if (auth.principalType !== "user")
    return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { "Content-Type": "application/json" } });
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string } | undefined;
  if (user?.role !== "ADMIN")
    return new Response(JSON.stringify({ error: "Forbidden: admin only" }), { status: 403, headers: { "Content-Type": "application/json" } });
  return null;
}

/**
 * Write audit log entry. Call before returning from route with final status.
 */
export async function auditLog(params: {
  orgId: string;
  principalId: string;
  principalType: "user" | "service_account";
  route: string;
  method: string;
  status: number;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        orgId: params.orgId,
        principalId: params.principalId,
        principalType: params.principalType,
        route: params.route,
        method: params.method,
        status: params.status,
      },
    });
  } catch (_) {}
}

export { hashToken, getBearerToken };
