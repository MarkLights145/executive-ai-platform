import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { AppLayout } from "../components/AppLayout";
import { KanbanBoard } from "../components/KanbanBoard";

export default async function TodoPage() {
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
      <div className="min-h-full bg-gradient-to-b from-neutral-50 to-white">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <KanbanBoard />
        </div>
      </div>
    </AppLayout>
  );
}
