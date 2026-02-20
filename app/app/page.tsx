import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { AppLayout } from "./components/AppLayout";

export default async function AppDashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | { email?: string | null; role?: string; organizationName?: string | null }
    | undefined;

  return (
    <AppLayout
      user={{
        email: user?.email,
        role: user?.role,
        organizationName: user?.organizationName,
      }}
    >
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Welcome to Executive AI
        </h1>
        <dl className="mt-6 grid gap-2 text-sm">
          <div>
            <dt className="font-medium text-neutral-500">Email</dt>
            <dd className="text-neutral-900">{user?.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Role</dt>
            <dd className="text-neutral-900">{user?.role ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-500">Organization</dt>
            <dd className="text-neutral-900">{user?.organizationName ?? "—"}</dd>
          </div>
        </dl>
      </div>
    </AppLayout>
  );
}
