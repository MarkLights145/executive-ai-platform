import { getAppSession } from "@/app/lib/auth";
import { AppLayout } from "../components/AppLayout";
import { ThemeToggle } from "./ThemeToggle";

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
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Settings
        </h1>
        <div className="mt-6 space-y-6">
          <ThemeToggle />
        </div>
      </div>
    </AppLayout>
  );
}
