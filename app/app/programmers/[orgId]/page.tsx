import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getAppSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { AppLayout } from "../../components/AppLayout";

export default async function ProgrammersOrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const { user, isProgrammer } = await getAppSession();
  if (!isProgrammer) redirect("/app");

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { users: true },
  });
  if (!org) notFound();

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
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            href="/app/programmers"
            className="inline-flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            ← Back to all
          </Link>

          {/* Org header */}
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-neutral-900">{org.name}</h1>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-neutral-500">Organization ID</dt>
                <dd className="font-mono text-neutral-900">{org.id}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Created</dt>
                <dd className="text-neutral-900">{new Date(org.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Users</dt>
                <dd className="text-neutral-900">{org.users.length}</dd>
              </div>
            </dl>
          </div>

          {/* Users */}
          <section className="mt-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Users in this org
            </h2>
            {org.users.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No users.</p>
            ) : (
              <ul className="mt-3 space-y-4">
                {org.users.map((u) => (
                  <li
                    key={u.id}
                    className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-neutral-900">{u.name ?? "—"}</p>
                        <p className="mt-0.5 font-mono text-sm text-neutral-600">{u.email}</p>
                      </div>
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                        {u.role}
                      </span>
                    </div>
                    <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-neutral-500">User ID</dt>
                        <dd className="font-mono text-xs text-neutral-700">{u.id}</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Advisory mode</dt>
                        <dd className="text-neutral-900">{u.advisoryMode ? "On" : "Off"}</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-500">Created</dt>
                        <dd className="text-neutral-900">{new Date(u.createdAt).toLocaleString()}</dd>
                      </div>
                      {u.telegramUserId && (
                        <div>
                          <dt className="text-neutral-500">Telegram</dt>
                          <dd className="text-neutral-900">{u.telegramUserId}</dd>
                        </div>
                      )}
                    </dl>
                    {u.onboardingPreferences != null && (
                      <div className="mt-3">
                        <dt className="text-xs font-medium text-neutral-500">Onboarding preferences</dt>
                        <dd className="mt-1 text-sm text-neutral-700">
                          <pre className="whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 font-sans text-xs">
                            {JSON.stringify(u.onboardingPreferences, null, 2)}
                          </pre>
                        </dd>
                      </div>
                    )}
                    {u.featureRequest && (
                      <div className="mt-3">
                        <dt className="text-xs font-medium text-neutral-500">Feature request</dt>
                        <dd className="mt-1 text-sm text-neutral-700">{u.featureRequest}</dd>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
