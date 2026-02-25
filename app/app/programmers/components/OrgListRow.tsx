"use client";

import Link from "next/link";
import { useState } from "react";
import { DeleteOrgButton } from "./DeleteOrgButton";
import { EditOrgForm } from "./EditOrgForm";

export function OrgListRow({
  orgId,
  orgName,
  userCount,
  createdAt,
}: {
  orgId: string;
  orgName: string;
  userCount: number;
  createdAt: Date;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:border-neutral-300 hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0 flex-1">
          <Link href={`/app/programmers/${orgId}`} className="block hover:opacity-80">
            <p className="font-medium text-neutral-900">{orgName}</p>
            <p className="text-sm text-neutral-500">
              {userCount} user{userCount !== 1 ? "s" : ""} · Created {new Date(createdAt).toLocaleDateString()}
            </p>
          </Link>
          {editing && (
            <EditOrgForm
              orgId={orgId}
              initialName={orgName}
              onCancel={() => setEditing(false)}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/app/programmers/${orgId}`}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <DeleteOrgButton orgId={orgId} orgName={orgName} />
        </div>
      </div>
    </li>
  );
}
