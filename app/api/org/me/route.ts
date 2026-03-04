import { NextResponse } from "next/server";
import { getApiAuth } from "@/app/lib/api-auth";
import { auditLog } from "@/app/lib/api-auth";

/**
 * GET /api/org/me — Returns orgId + principal info (for debugging). Requires auth (session or Bearer).
 */
export async function GET(req: Request) {
  const auth = await getApiAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = {
    orgId: auth.orgId,
    principalType: auth.principalType,
    principalId: auth.principalId,
    scopes: auth.principalType === "service_account" ? auth.scopes : undefined,
  };

  await auditLog({
    orgId: auth.orgId,
    principalId: auth.principalId,
    principalType: auth.principalType,
    route: "/api/org/me",
    method: "GET",
    status: 200,
  });

  return NextResponse.json(payload);
}
