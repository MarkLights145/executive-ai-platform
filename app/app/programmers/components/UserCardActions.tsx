"use client";

import { useState } from "react";
import { DeleteUserButton } from "./DeleteUserButton";
import { EditUserForm } from "./EditUserForm";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export function UserCardActions({ user, children }: { user: User; children: React.ReactNode }) {
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <DeleteUserButton
            userId={user.id}
            userLabel={user.name || user.email}
          />
        </div>
      </div>
      {editing && (
        <EditUserForm
          userId={user.id}
          initialName={user.name}
          initialEmail={user.email}
          initialRole={user.role}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
