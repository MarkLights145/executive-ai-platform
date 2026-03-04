import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { requireAuth, requireAdmin, auditLog } from "@/app/lib/api-auth";

/**
 * GET /api/org — Get current org. Auth via session or Bearer; orgId from auth (multi-tenant safe).
 */
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const org = await prisma.organization.findUnique({
    where: { id: auth.orgId },
    select: { id: true, name: true, openaiKeyRef: true },
  });
  if (!org) {
    await auditLog({
      orgId: auth.orgId,
      principalId: auth.principalId,
      principalType: auth.principalType,
      route: "/api/org",
      method: "GET",
      status: 404,
    });
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  await auditLog({
    orgId: auth.orgId,
    principalId: auth.principalId,
    principalType: auth.principalType,
    route: "/api/org",
    method: "GET",
    status: 200,
  });

  return NextResponse.json(org);
}

/**
 * PATCH /api/org — Update org (admin only). Body: { openaiKeyRef? }. orgId from auth only.
 */
export async function PATCH(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const forbidden = await requireAdmin(auth);
  if (forbidden) return forbidden;

  let body: { openaiKeyRef?: string };
  try {
    body = (await req.json()) as { openaiKeyRef?: string };
  } catch {
    await auditLog({
      orgId: auth.orgId,
      principalId: auth.principalId,
      principalType: auth.principalType,
      route: "/api/org",
      method: "PATCH",
      status: 400,
    });
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const openaiKeyRef = body.openaiKeyRef?.trim();
  const data = openaiKeyRef !== undefined ? { openaiKeyRef: openaiKeyRef === "" ? null : openaiKeyRef } : {};

  const org = await prisma.organization.update({
    where: { id: auth.orgId },
    data,
    select: { id: true, name: true, openaiKeyRef: true },
  });

  await auditLog({
    orgId: auth.orgId,
    principalId: auth.principalId,
    principalType: auth.principalType,
    route: "/api/org",
    method: "PATCH",
    status: 200,
  });

  return NextResponse.json(org);
}
