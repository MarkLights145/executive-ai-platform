import { getAppSession } from "@/app/lib/auth";
import { AppLayout } from "../components/AppLayout";

export default async function SettingsPage() {
  const { user, isProgrammer } = await getAppSession();

  return (
    <AppLayout
      user={{
        email: user?.email,
        role: user?.role,
        organizationName: user?.organizationName,
      }}
      isProgrammer={isProgrammer}
    >
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
        <p className="mt-2 text-sm text-neutral-500">Coming soon.</p>
      </div>
    </AppLayout>
  );
}
