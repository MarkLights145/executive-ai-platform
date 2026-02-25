"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addProjectLead, removeProjectLead } from "../actions";

type Lead = { id: string; name: string | null; email: string };
type OrgUser = { id: string; name: string | null; email: string };

export function ProjectLeadsSection({
  projectId,
  leads,
  orgUsers,
}: {
  projectId: string;
  leads: Lead[];
  orgUsers: OrgUser[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addingUserId, setAddingUserId] = useState<string>("");

  const leadIds = new Set(leads.map((l) => l.id));
  const availableUsers = orgUsers.filter((u) => !leadIds.has(u.id));

  const handleAdd = (userId: string) => {
    if (!userId) return;
    setAddingUserId(userId);
    startTransition(async () => {
      await addProjectLead(projectId, userId);
      setAddingUserId("");
      router.refresh();
    });
  };

  const handleRemove = (userId: string) => {
    startTransition(async () => {
      await removeProjectLead(projectId, userId);
      router.refresh();
    });
  };

  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-neutral-700">Project leads</h3>
      <p className="mt-0.5 text-xs text-neutral-500">
        Users who can see this project on their Projects tab. Assign leads so they can view and manage tasks here.
      </p>
      <ul className="mt-3 space-y-2">
        {leads.map((lead) => (
          <li
            key={lead.id}
            className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/50 px-3 py-2"
          >
            <span className="text-sm font-medium text-neutral-900">{lead.name || lead.email}</span>
            <span className="text-xs text-neutral-500">{lead.email}</span>
            <button
              type="button"
              onClick={() => handleRemove(lead.id)}
              disabled={isPending}
              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {availableUsers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={addingUserId}
            onChange={(e) => handleAdd(e.target.value)}
            disabled={isPending}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="">Add lead…</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
        </div>
      )}
      {leads.length === 0 && availableUsers.length === 0 && (
        <p className="mt-2 text-sm text-neutral-500">No other org users to add as lead.</p>
      )}
    </div>
  );
}
