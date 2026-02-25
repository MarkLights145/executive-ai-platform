"use client";

import { useState } from "react";
import { DeleteOrgButton } from "./DeleteOrgButton";
import { EditOrgForm } from "./EditOrgForm";

export function OrgDetailActions({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setEditing(!editing)}
        className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        {editing ? "Cancel" : "Edit org"}
      </button>
      <DeleteOrgButton orgId={orgId} orgName={orgName} />
      {editing && (
        <EditOrgForm
          orgId={orgId}
          initialName={orgName}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}
