import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

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
 * GET /api/tasks
 * Returns tasks assigned to the current user (ProjectTask with assigneeId),
 * with project name. Admins see all org tasks; USER role sees only their assigned tasks.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string; organizationId?: string } | undefined;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assigned = await prisma.projectTask.findMany({
    where: { assigneeId: user.id },
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

  return NextResponse.json({ tasks });
}
