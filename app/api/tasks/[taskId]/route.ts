import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { requireAuth, auditLog } from "@/app/lib/api-auth";

/**
 * PATCH /api/tasks/[taskId] — Update task status. Scoped by auth.orgId; user must be assignee (or service_account with scope).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const { taskId } = await params;
  const body = await req.json().catch(() => ({}));
  const { status } = body as { status?: string };

  if (!status || !["todo", "in_progress", "done"].includes(status)) {
    await auditLog({
      orgId: auth.orgId,
      principalId: auth.principalId,
      principalType: auth.principalType,
      route: "/api/tasks/" + taskId,
      method: "PATCH",
      status: 400,
    });
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const task = await prisma.projectTask.findFirst({
    where: {
      id: taskId,
      project: { organizationId: auth.orgId },
      ...(auth.principalType === "user" ? { assigneeId: auth.principalId } : {}),
    },
  });
  if (!task) {
    await auditLog({
      orgId: auth.orgId,
      principalId: auth.principalId,
      principalType: auth.principalType,
      route: "/api/tasks/" + taskId,
      method: "PATCH",
      status: 404,
    });
    return NextResponse.json({ error: "Not found or not assigned to you" }, { status: 404 });
  }

  await prisma.projectTask.update({
    where: { id: taskId },
    data: { status: status as "todo" | "in_progress" | "done" },
  });

  await auditLog({
    orgId: auth.orgId,
    principalId: auth.principalId,
    principalType: auth.principalType,
    route: "/api/tasks/" + taskId,
    method: "PATCH",
    status: 200,
  });

  return NextResponse.json({ ok: true });
}
