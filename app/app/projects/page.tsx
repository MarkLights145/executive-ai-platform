import Link from "next/link";
import { getAppSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { AppLayout } from "../components/AppLayout";
import { CreateProjectForm } from "./components/CreateProjectForm";

export default async function ProjectsPage() {
  const { user, isProgrammer } = await getAppSession();
  const organizationId = (user as { organizationId?: string })?.organizationId;
  if (!organizationId) {
    return (
      <AppLayout
        user={{
          email: user?.email,
          role: user?.role,
          organizationName: user?.organizationName,
        }}
        isProgrammer={isProgrammer}
      >
        <div className="mx-auto max-w-5xl px-6 py-8">
          <p className="text-neutral-600">You need to be in an organization to view projects.</p>
        </div>
      </AppLayout>
    );
  }

  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: {
      tasks: true,
    },
    orderBy: { updatedAt: "desc" },
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
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Projects
              </h1>
              <p className="mt-1 text-neutral-600">
                Track progress. Click a project to manage tasks in a Kanban board.
              </p>
            </div>
            <CreateProjectForm />
          </div>

          <ul className="mt-8 space-y-4">
            {projects.length === 0 ? (
              <li className="rounded-2xl border border-neutral-200 bg-white py-12 text-center text-neutral-500">
                No projects yet. Create one to get started.
              </li>
            ) : (
              projects.map((project) => {
                const total = project.tasks.length;
                const done = project.tasks.filter((t) => t.status === "done").length;
                const progress = total === 0 ? 0 : Math.round((done / total) * 100);
                return (
                  <li key={project.id}>
                    <Link
                      href={`/app/projects/${project.id}`}
                      className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
                    >
                      <div>
                        <p className="font-medium text-neutral-900">{project.name}</p>
                        {project.description && (
                          <p className="mt-0.5 text-sm text-neutral-500 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                        <p className="mt-2 text-sm text-neutral-500">
                          {done}/{total} tasks done
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-neutral-400">→</span>
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
