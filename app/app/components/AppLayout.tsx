import type { ReactNode } from "react";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";

export type AppLayoutUser = {
  email?: string | null;
  role?: string;
  organizationName?: string | null;
};

export function AppLayout({
  user,
  isProgrammer = false,
  children,
}: {
  user: AppLayoutUser;
  isProgrammer?: boolean;
  children: ReactNode;
}) {
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 dark:bg-neutral-900">
      <Topbar email={user.email} />
      <div className="flex flex-1">
        <Sidebar isAdmin={isAdmin} isProgrammer={isProgrammer} userEmail={user.email} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
