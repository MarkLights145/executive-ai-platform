"use client";

import { useTransition } from "react";
import { deleteOrganization } from "../actions";

export function DeleteOrgButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete organization “${orgName}” and all its users? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteOrganization(orgId);
      window.location.href = "/app/programmers";
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
