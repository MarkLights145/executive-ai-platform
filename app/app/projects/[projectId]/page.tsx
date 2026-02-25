import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { AppLayout } from "../../components/AppLayout";
import { ProjectKanban } from "../components/ProjectKanban";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user, isProgrammer } = await getAppSession();
  const organizationId = (user as { organizationId?: string })?.organizationId;
  if (!organizationId) notFound();

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    include: {
      tasks: {
        include: { assignee: { select: { id: true, name: true, email: true } } },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!project) notFound();

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
          </div>
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
