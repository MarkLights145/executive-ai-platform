import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/db";
import { AppLayout } from "../components/AppLayout";

function isPersonalOrg(name: string) {
  return name.includes("(Personal)");
}

export default async function ProgrammersDashboardPage() {
  const { user, isProgrammer } = await getAppSession();
  if (!isProgrammer) redirect("/app");

  const orgs = await prisma.organization.findMany({
    include: { users: true },
    orderBy: { createdAt: "desc" },
  });

  const organizations = orgs.filter((o) => !isPersonalOrg(o.name));
  const individuals = orgs.filter((o) => isPersonalOrg(o.name));

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
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Programmers dashboard
          </h1>
          <p className="mt-1 text-neutral-600">
            All organizations and individuals. Click one to see full details and users.
          </p>

          {/* Organizations */}
          <section className="mt-10">
            <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Organizations
            </h2>
            <ul className="mt-3 space-y-3">
              {organizations.length === 0 ? (
                <li className="rounded-xl border border-neutral-200 bg-white py-8 text-center text-sm text-neutral-500">
                  No organizations yet
                </li>
              ) : (
                organizations.map((org) => (
                  <li key={org.id}>
                    <Link
                      href={`/app/programmers/${org.id}`}
                      className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
                    >
                      <div>
                        <p className="font-medium text-neutral-900">{org.name}</p>
                        <p className="text-sm text-neutral-500">
                          {org.users.length} user{org.users.length !== 1 ? "s" : ""} · Created{" "}
                          {new Date(org.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-neutral-400">View →</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Individuals (personal orgs) */}
          <section className="mt-10">
            <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Individuals
            </h2>
            <ul className="mt-3 space-y-3">
              {individuals.length === 0 ? (
                <li className="rounded-xl border border-neutral-200 bg-white py-8 text-center text-sm text-neutral-500">
                  No individual accounts yet
                </li>
              ) : (
                individuals.map((org) => (
                  <li key={org.id}>
                    <Link
                      href={`/app/programmers/${org.id}`}
                      className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
                    >
                      <div>
                        <p className="font-medium text-neutral-900">{org.name}</p>
                        <p className="text-sm text-neutral-500">
                          {org.users.length} user{org.users.length !== 1 ? "s" : ""} · Created{" "}
                          {new Date(org.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-neutral-400">View →</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
