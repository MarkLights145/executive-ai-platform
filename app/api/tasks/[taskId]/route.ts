import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

/**
 * PATCH /api/tasks/[taskId] — Update task status (for assignee's To-Do board)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;
  const body = await req.json().catch(() => ({}));
  const { status } = body as { status?: string };

  if (!status || !["todo", "in_progress", "done"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const task = await prisma.projectTask.findFirst({
    where: { id: taskId, assigneeId: user.id },
  });
  if (!task) {
    return NextResponse.json({ error: "Not found or not assigned to you" }, { status: 404 });
  }

  await prisma.projectTask.update({
    where: { id: taskId },
    data: { status: status as "todo" | "in_progress" | "done" },
  });

  return NextResponse.json({ ok: true });
}
