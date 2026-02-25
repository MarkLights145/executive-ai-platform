"use client";

import { useTransition } from "react";
import { deleteUser } from "../actions";

export function DeleteUserButton({
  userId,
  userLabel,
  onDeleted,
}: {
  userId: string;
  userLabel: string;
  onDeleted?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete user “${userLabel}”? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteUser(userId);
      onDeleted?.();
      if (typeof window !== "undefined") window.location.reload();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
