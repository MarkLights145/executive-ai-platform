"use server";

import { revalidatePath } from "next/cache";
import { getAppSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

async function requireOrg() {
  const { user } = await getAppSession();
  if (!user?.organizationId) throw new Error("Unauthorized");
  return user.organizationId;
}

export async function createProject(name: string, description?: string) {
  const organizationId = await requireOrg();
  if (!name?.trim()) throw new Error("Project name is required");
  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      organizationId,
    },
  });
  revalidatePath("/app/projects");
  return project.id;
}

export async function updateProject(projectId: string, data: { name?: string; description?: string }) {
  const organizationId = await requireOrg();
  await prisma.project.findFirstOrThrow({
    where: { id: projectId, organizationId },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
    },
  });
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${projectId}`);
}

export async function createProjectTask(
  projectId: string,
  title: string,
  description?: string
) {
  const organizationId = await requireOrg();
  await prisma.project.findFirstOrThrow({
    where: { id: projectId, organizationId },
  });
  const maxOrder = await prisma.projectTask
    .findMany({ where: { projectId }, select: { order: true }, orderBy: { order: "desc" }, take: 1 })
    .then((r) => r[0]?.order ?? -1);
  await prisma.projectTask.create({
    data: {
      projectId,
      title: title.trim(),
      description: description?.trim() || null,
      status: "todo",
      order: maxOrder + 1,
    },
  });
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${projectId}`);
}

export async function updateProjectTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    status?: "todo" | "in_progress" | "done";
    assigneeId?: string | null;
  }
) {
  const organizationId = await requireOrg();
  const task = await prisma.projectTask.findFirstOrThrow({
    where: { id: taskId, project: { organizationId } },
    include: { project: true },
  });
  await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId || null }),
    },
  });
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${task.projectId}`);
}

export async function pingProjectTask(taskId: string) {
  const organizationId = await requireOrg();
  const task = await prisma.projectTask.findFirstOrThrow({
    where: { id: taskId, project: { organizationId } },
    include: { project: true },
  });
  await prisma.projectTask.update({
    where: { id: taskId },
    data: { lastPingedAt: new Date() },
  });
  revalidatePath(`/app/projects/${task.projectId}`);
}

export async function setTaskStatusResponse(taskId: string, response: string) {
  const organizationId = await requireOrg();
  const task = await prisma.projectTask.findFirstOrThrow({
    where: { id: taskId, project: { organizationId } },
    include: { project: true },
  });
  await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      lastStatusResponse: response.trim() || null,
      lastStatusAt: new Date(),
    },
  });
  revalidatePath(`/app/projects/${task.projectId}`);
}
