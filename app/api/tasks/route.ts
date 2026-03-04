import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { requireAuth, auditLog } from "@/app/lib/api-auth";

export type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  description?: string;
  source?: "openclaw" | "local";
  projectId?: string;
  projectName?: string;
};

/**
 * GET /api/tasks — Tasks scoped by auth.orgId (user: assigned to them; service_account: all org tasks).
 */
export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const where: { project: { organizationId: string }; assigneeId?: string } = {
    project: { organizationId: auth.orgId },
  };
  if (auth.principalType === "user") {
    where.assigneeId = auth.principalId;
  }

  const assigned = await prisma.projectTask.findMany({
    where,
    include: { project: { select: { id: true, name: true } } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const tasks: Task[] = assigned.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status as "todo" | "in_progress" | "done",
    description: t.description ?? undefined,
    source: "local" as const,
    projectId: t.project.id,
    projectName: t.project.name,
  }));

  await auditLog({
    orgId: auth.orgId,
    principalId: auth.principalId,
    principalType: auth.principalType,
    route: "/api/tasks",
    method: "GET",
    status: 200,
  });

  return NextResponse.json({ tasks });
}
