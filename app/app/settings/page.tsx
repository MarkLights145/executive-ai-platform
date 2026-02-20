import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { AppLayout } from "../components/AppLayout";

export default async function SettingsPage() {
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
        <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
        <p className="mt-2 text-sm text-neutral-500">Coming soon.</p>
      </div>
    </AppLayout>
  );
}
