"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrgUser, pingOrgUser } from "../actions";
import type { UserWithTasks } from "../page";

type UserRow = UserWithTasks & {
  status: "free" | "working" | "busy";
  workingOn: string[];
  queueCount: number;
};

const STATUS_DOT = {
  free: "bg-emerald-500",
  working: "bg-amber-500",
  busy: "bg-red-500",
} as const;

export function UsersList({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupSelected, setGroupSelected] = useState<Set<string>>(new Set());
  const [pingedId, setPingedId] = useState<string | null>(null);

  const toggleGroupSelect = (userId: string) => {
    setGroupSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const sendGroupMessage = () => {
    if (groupSelected.size === 0) return;
    const emails = users.filter((u) => groupSelected.has(u.id)).map((u) => u.email);
    window.location.href = `mailto:${emails.join(",")}`;
  };

  return (
    <div className="mt-8 space-y-4">
      {groupSelected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-amber-50/80 px-4 py-3">
          <span className="text-sm font-medium text-amber-900">
            {groupSelected.size} selected
          </span>
          <button
            type="button"
            onClick={sendGroupMessage}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            Send group message
          </button>
          <button
            type="button"
            onClick={() => setGroupSelected(new Set())}
            className="rounded-md border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-800"
          >
            Clear
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {users.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={groupSelected.has(u.id)}
                  onChange={() => toggleGroupSelect(u.id)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${STATUS_DOT[u.status]}`}
                  title={
                    u.status === "free"
                      ? "Free"
                      : u.status === "working"
                        ? "Working on something"
                        : "Busy (multiple tasks)"
                  }
                />
              </label>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-neutral-900">{u.name || u.email}</p>
                <p className="text-sm text-neutral-500">{u.email}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {u.status === "free" && "Free"}
                  {u.status === "working" && (
                    <>Working on: {u.workingOn.length > 0 ? u.workingOn.join(", ") : "1 task"}</>
                  )}
                  {u.status === "busy" && (
                    <>
                      {u.workingOn.length > 0 && `${u.workingOn.join(", ")}`}
                      {u.workingOn.length > 0 && u.queueCount > 0 && " · "}
                      {u.queueCount > 0 && `${u.queueCount} in queue`}
                      {u.workingOn.length === 0 && u.queueCount === 0 && "Multiple tasks"}
                    </>
                  )}
                </p>
                {u.lastPingedAt && (
                  <p className="mt-0.5 text-xs text-neutral-400">
                    Pinged {new Date(u.lastPingedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                {u.role}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {editingId === u.id ? "Cancel" : "Edit"}
              </button>
              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    await pingOrgUser(u.id);
                    setPingedId(u.id);
                    router.refresh();
                    setTimeout(() => setPingedId(null), 2000);
                  });
                }}
                disabled={isPending}
                className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                {pingedId === u.id ? "Pinged" : "Ping"}
              </button>
              <a
                href={`mailto:${u.email}`}
                className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Message
              </a>
            </div>
            {editingId === u.id && (
              <EditUserForm
                user={u}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
                isPending={isPending}
                startTransition={startTransition}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditUserForm({
  user,
  onCancel,
  onSaved,
  isPending,
  startTransition,
}: {
  user: UserRow;
  onCancel: () => void;
  onSaved: () => void;
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateOrgUser(user.id, {
          name: name.trim() || null,
          email: email.trim(),
          role,
        });
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-neutral-500">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-0.5 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-0.5 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-neutral-500">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-0.5 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium">
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
