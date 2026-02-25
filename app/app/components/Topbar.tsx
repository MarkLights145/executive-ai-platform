import Link from "next/link";

export function Topbar({ email }: { email: string | null | undefined }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6 dark:border-neutral-700 dark:bg-neutral-800">
      <Link
        href="/app"
        className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
      >
        Executive AI
      </Link>
      <nav className="flex items-center gap-4">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">{email ?? "—"}</span>
        <Link
          href="/api/auth/signout"
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
        >
          Sign out
        </Link>
      </nav>
    </header>
  );
}
