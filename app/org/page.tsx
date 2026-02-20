import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import Link from "next/link";

export default async function OrgDashboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
        <div className="text-center">
          <p className="text-neutral-400">You don’t have access to the organization dashboard.</p>
          <Link href="/app" className="mt-4 inline-block text-amber-400 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white">
            Executive AI
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/app" className="text-sm text-neutral-400 hover:text-white">
              Dashboard
            </Link>
            <span className="text-sm text-neutral-400">{session?.user?.email}</span>
            <Link
              href="/api/auth/signout"
              className="rounded-lg border border-neutral-600 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-500 hover:text-white"
            >
              Sign out
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-white">Organization</h1>
        <p className="mt-2 text-neutral-400">
          Manage your organization and members. Admin-only.
        </p>
        <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <p className="text-sm text-neutral-500">Organization settings and member list will appear here.</p>
        </div>
      </main>
    </div>
  );
}
