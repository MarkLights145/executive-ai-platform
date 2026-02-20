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
  children,
}: {
  user: AppLayoutUser;
  children: ReactNode;
}) {
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col bg-neutral-100">
      <Topbar email={user.email} />
      <div className="flex flex-1">
        <Sidebar isAdmin={isAdmin} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
