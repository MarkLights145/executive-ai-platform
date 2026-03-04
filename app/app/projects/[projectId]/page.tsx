import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { AppLayout } from "../../components/AppLayout";
import { ProjectLeadsSection } from "../components/ProjectLeadsSection";
import { ProjectKanban } from "../components/ProjectKanban";
import { ProjectTimeline } from "../components/ProjectTimeline";
import { ProjectDetailsForm } from "../components/ProjectDetailsForm";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user, isProgrammer } = await getAppSession();
  const organizationId = (user as { organizationId?: string })?.organizationId;
  const userId = (user as { id?: string })?.id;
  const isAdmin = user?.role === "ADMIN";
  if (!organizationId) notFound();

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    include: {
      tasks: {
        include: { assignee: { select: { id: true, name: true, email: true } } },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
      projectLeads: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!project) notFound();
  const isLead = userId && project.projectLeads.some((pl) => pl.userId === userId);
  if (!isAdmin && !isLead) notFound();

  const orgUsers = await prisma.user.findMany({
    where: { organizationId },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <AppLayout
      user={{
        email: user?.email,
        role: user?.role,
        organizationName: user?.organizationName,
      }}
      isProgrammer={isProgrammer}
    >
      <div className="min-h-full bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link
            href="/app/projects"
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            ← Projects
          </Link>
          <div className="mt-4">
            <h1 className="text-2xl font-semibold text-neutral-900">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-neutral-600">{project.description}</p>
            )}
            <ProjectDetailsForm
              projectId={project.id}
              initialName={project.name}
              initialDescription={project.description}
              projectType={project.projectType}
              dates={{
                eventStart: project.eventStart?.toISOString() ?? null,
                eventEnd: project.eventEnd?.toISOString() ?? null,
                loadInStart: project.loadInStart?.toISOString() ?? null,
                loadInEnd: project.loadInEnd?.toISOString() ?? null,
                loadOutStart: project.loadOutStart?.toISOString() ?? null,
                loadOutEnd: project.loadOutEnd?.toISOString() ?? null,
                truckLoad: project.truckLoad?.toISOString() ?? null,
                truckReturn: project.truckReturn?.toISOString() ?? null,
              }}
            />
          </div>
          <ProjectTimeline
            projectName={project.name}
            projectType={project.projectType}
            dates={{
              eventStart: project.eventStart?.toISOString() ?? null,
              eventEnd: project.eventEnd?.toISOString() ?? null,
              loadInStart: project.loadInStart?.toISOString() ?? null,
              loadInEnd: project.loadInEnd?.toISOString() ?? null,
              loadOutStart: project.loadOutStart?.toISOString() ?? null,
              loadOutEnd: project.loadOutEnd?.toISOString() ?? null,
              truckLoad: project.truckLoad?.toISOString() ?? null,
              truckReturn: project.truckReturn?.toISOString() ?? null,
            }}
          />
          {isAdmin && (
            <ProjectLeadsSection
              projectId={project.id}
              leads={project.projectLeads.map((pl) => ({
                id: pl.user.id,
                name: pl.user.name,
                email: pl.user.email,
              }))}
              orgUsers={orgUsers}
            />
          )}
          <ProjectKanban
            projectId={project.id}
            projectName={project.name}
            tasks={project.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description ?? undefined,
              status: t.status as "todo" | "in_progress" | "done",
              assigneeId: t.assigneeId ?? undefined,
              assignee: t.assignee
                ? { id: t.assignee.id, name: t.assignee.name, email: t.assignee.email }
                : undefined,
              lastStatusResponse: t.lastStatusResponse ?? undefined,
              lastStatusAt: t.lastStatusAt?.toISOString(),
              lastPingedAt: t.lastPingedAt?.toISOString(),
            }))}
            orgUsers={orgUsers}
          />
        </div>
      </div>
    </AppLayout>
  );
}
