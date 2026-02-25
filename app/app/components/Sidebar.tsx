import Link from "next/link";

const navItemsAll = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/todo", label: "To-Do" },
  { href: "/app/projects", label: "Projects" },
  { href: "/app/email-rundown", label: "Email Rundown" },
] as const;

const navItemsUser = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/todo", label: "To-Do" },
  { href: "/app/projects", label: "Projects" },
] as const;

const PROGRAMMER_EMAIL_DEFAULT = "mamiller561@gmail.com";

export function Sidebar({
  isAdmin,
  isProgrammer,
  userEmail,
}: {
  isAdmin: boolean;
  isProgrammer?: boolean;
  userEmail?: string | null;
}) {
  const showProgrammers =
    isProgrammer || (userEmail?.trim().toLowerCase() === PROGRAMMER_EMAIL_DEFAULT);

  const navItems = isAdmin ? navItemsAll : navItemsUser;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-800/80">
      <nav className="flex flex-col gap-0.5 p-3">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
          >
            {label}
          </Link>
        ))}
        {showProgrammers && (
          <Link
            href="/app/programmers"
            className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
          >
            Programmers
          </Link>
        )}
        {isAdmin && (
          <>
            <Link
              href="/org"
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
            >
              Organization
            </Link>
            <Link
              href="/app/users"
              className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
            >
              Users
            </Link>
          </>
        )}
        <Link
          href="/app/settings"
          className="rounded-md px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-neutral-100"
        >
          Settings
        </Link>
      </nav>
    </aside>
  );
}
