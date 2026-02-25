import { redirect } from "next/navigation";
import { getAppSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { AppLayout } from "../components/AppLayout";
import { AddUserButton } from "./components/AddUserButton";
import { AddAdminButton } from "./components/AddAdminButton";
import { UsersList } from "./components/UsersList";

export type UserWithTasks = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  lastPingedAt: Date | null;
  assignedTasks: {
    id: string;
    title: string;
    status: string;
    project: { name: string };
  }[];
};

function statusFromTasks(assignedTasks: UserWithTasks["assignedTasks"]): "free" | "working" | "busy" {
  const inProgress = assignedTasks.filter((t) => t.status === "in_progress");
  const todo = assignedTasks.filter((t) => t.status === "todo");
  if (inProgress.length >= 2 || inProgress.length + todo.length >= 3) return "busy";
  if (inProgress.length === 1) return "working";
  return "free";
}

export default async function UsersPage() {
  const { user, isProgrammer } = await getAppSession();
  const organizationId = (user as { organizationId?: string })?.organizationId;
  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin) redirect("/app");
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
          <p className="text-neutral-600">You must be in an organization to manage users.</p>
        </div>
      </AppLayout>
    );
  }

  const orgUsers = await prisma.user.findMany({
    where: { organizationId },
    include: {
      assignedProjectTasks: {
        where: { status: { in: ["todo", "in_progress"] } },
        select: {
          id: true,
          title: true,
          status: true,
          project: { select: { name: true } },
        },
      },
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  const users: UserWithTasks[] = orgUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    lastPingedAt: u.lastPingedAt,
    assignedTasks: u.assignedProjectTasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      project: t.project,
    })),
  }));

  const usersWithStatus = users.map((u) => ({
    ...u,
    status: statusFromTasks(u.assignedTasks),
    workingOn: u.assignedTasks
      .filter((t) => t.status === "in_progress")
      .map((t) => t.title),
    queueCount: u.assignedTasks.filter((t) => t.status === "todo").length,
  }));

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
                Organization users
              </h1>
              <p className="mt-1 text-neutral-600">
            See status, what they’re working on, and message or ping them.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AddUserButton />
              <AddAdminButton />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Free
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Working on something
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Busy (multiple tasks)
            </span>
          </div>
          <UsersList users={usersWithStatus} />
        </div>
      </div>
    </AppLayout>
  );
}
