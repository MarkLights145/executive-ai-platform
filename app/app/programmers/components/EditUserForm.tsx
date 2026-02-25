"use client";

import { useState, useTransition } from "react";
import { updateUser } from "../actions";

export function EditUserForm({
  userId,
  initialName,
  initialEmail,
  initialRole,
  onCancel,
  onSaved,
}: {
  userId: string;
  initialName: string | null;
  initialEmail: string;
  initialRole: string;
  onCancel: () => void;
  onSaved?: () => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] = useState(initialRole);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateUser(userId, {
          name: name.trim() || null,
          email: email.trim(),
          role,
        });
        onSaved?.();
        if (typeof window !== "undefined") window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
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
          className="mt-0.5 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          required
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
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
