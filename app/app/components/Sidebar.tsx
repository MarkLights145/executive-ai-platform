import Link from "next/link";

const navItems = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/email-rundown", label: "Email Rundown" },
] as const;

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/80">
      <nav className="flex flex-col gap-0.5 p-3">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
          >
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/org"
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
          >
            Organization
          </Link>
        )}
        <Link
          href="/app/settings"
          className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
        >
          Settings
        </Link>
      </nav>
    </aside>
  );
}
