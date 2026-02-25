import { getAppSession } from "@/app/lib/auth";
import { AppLayout } from "../components/AppLayout";
import { KanbanBoard } from "../components/KanbanBoard";

export default async function TodoPage() {
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
      <div className="min-h-full bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <KanbanBoard />
        </div>
      </div>
    </AppLayout>
  );
}
