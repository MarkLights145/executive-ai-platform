"use server";

import { revalidatePath } from "next/cache";
import { getAppSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";

type ProjectTimelineInput = {
  projectType?: string;
  eventStart?: string | null;
  eventEnd?: string | null;
  loadInStart?: string | null;
  loadInEnd?: string | null;
  loadOutStart?: string | null;
  loadOutEnd?: string | null;
  truckLoad?: string | null;
  truckReturn?: string | null;
};

async function requireOrg() {
  const { user } = await getAppSession();
  if (!user?.organizationId) throw new Error("Unauthorized");
  return user.organizationId;
}

export async function createProject(
  name: string,
  description?: string,
  timeline?: ProjectTimelineInput
) {
  const organizationId = await requireOrg();
  if (!name?.trim()) throw new Error("Project name is required");
  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      organizationId,
      projectType: timeline?.projectType?.trim() || null,
      eventStart: timeline?.eventStart ? new Date(timeline.eventStart) : undefined,
      eventEnd: timeline?.eventEnd ? new Date(timeline.eventEnd) : undefined,
      loadInStart: timeline?.loadInStart ? new Date(timeline.loadInStart) : undefined,
      loadInEnd: timeline?.loadInEnd ? new Date(timeline.loadInEnd) : undefined,
      loadOutStart: timeline?.loadOutStart ? new Date(timeline.loadOutStart) : undefined,
      loadOutEnd: timeline?.loadOutEnd ? new Date(timeline.loadOutEnd) : undefined,
      truckLoad: timeline?.truckLoad ? new Date(timeline.truckLoad) : undefined,
      truckReturn: timeline?.truckReturn ? new Date(timeline.truckReturn) : undefined,
    },
  });
  revalidatePath("/app/projects");
  return project.id;
}

export async function updateProject(
  projectId: string,
  data: {
    name?: string;
    description?: string;
    projectType?: string | null;
    eventStart?: string | null;
    eventEnd?: string | null;
    loadInStart?: string | null;
    loadInEnd?: string | null;
    loadOutStart?: string | null;
    loadOutEnd?: string | null;
    truckLoad?: string | null;
    truckReturn?: string | null;
  }
) {
  const organizationId = await requireOrg();
  await prisma.project.findFirstOrThrow({
    where: { id: projectId, organizationId },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.projectType !== undefined && {
        projectType: data.projectType?.trim() || null,
      }),
      ...(data.eventStart !== undefined && {
        eventStart: data.eventStart ? new Date(data.eventStart) : null,
      }),
      ...(data.eventEnd !== undefined && {
        eventEnd: data.eventEnd ? new Date(data.eventEnd) : null,
      }),
      ...(data.loadInStart !== undefined && {
        loadInStart: data.loadInStart ? new Date(data.loadInStart) : null,
      }),
      ...(data.loadInEnd !== undefined && {
        loadInEnd: data.loadInEnd ? new Date(data.loadInEnd) : null,
      }),
      ...(data.loadOutStart !== undefined && {
        loadOutStart: data.loadOutStart ? new Date(data.loadOutStart) : null,
      }),
      ...(data.loadOutEnd !== undefined && {
        loadOutEnd: data.loadOutEnd ? new Date(data.loadOutEnd) : null,
      }),
      ...(data.truckLoad !== undefined && {
        truckLoad: data.truckLoad ? new Date(data.truckLoad) : null,
      }),
      ...(data.truckReturn !== undefined && {
        truckReturn: data.truckReturn ? new Date(data.truckReturn) : null,
      }),
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

async function requireAdminOrg() {
  const { user } = await getAppSession();
  if (!user?.organizationId || user.role !== "ADMIN") throw new Error("Forbidden");
  return user.organizationId;
}

export async function addProjectLead(projectId: string, userId: string) {
  const organizationId = await requireAdminOrg();
  await prisma.project.findFirstOrThrow({
    where: { id: projectId, organizationId },
  });
  const member = await prisma.user.findFirstOrThrow({
    where: { id: userId, organizationId },
  });
  await prisma.projectLead.upsert({
    where: {
      projectId_userId: { projectId, userId: member.id },
    },
    create: { projectId, userId: member.id },
    update: {},
  });
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${projectId}`);
}

export async function removeProjectLead(projectId: string, userId: string) {
  const organizationId = await requireAdminOrg();
  await prisma.project.findFirstOrThrow({
    where: { id: projectId, organizationId },
  });
  await prisma.projectLead.deleteMany({
    where: { projectId, userId },
  });
  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${projectId}`);
}
