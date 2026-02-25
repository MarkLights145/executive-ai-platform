"use client";

import { useState, useTransition } from "react";
import { updateOrganization } from "../actions";

export function EditOrgForm({
  orgId,
  initialName,
  onCancel,
  onSaved,
}: {
  orgId: string;
  initialName: string;
  onCancel: () => void;
  onSaved?: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateOrganization(orgId, { name: name.trim() });
        onSaved?.();
        if (typeof window !== "undefined") window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-center gap-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Organization name"
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        autoFocus
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || !name.trim()}
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
