"use client";

import { useState, useEffect } from "react";

type Escalation = {
  id: string;
  userId: string;
  messageText: string;
  reason: string;
  status: string;
  createdAt: string;
};

export function EscalationInbox() {
  const [list, setList] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  function fetchList() {
    fetch("/api/escalations")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.escalations)) setList(data.escalations);
        else setList([]);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/escalations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchList();
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div id="escalations" className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h3 className="text-lg font-semibold text-white">Escalation inbox</h3>
        <p className="mt-2 text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div id="escalations" className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <h3 className="text-lg font-semibold text-white">Escalation inbox</h3>
      <p className="mt-1 text-sm text-neutral-500">Off-script user messages escalated here. Admins get email notifications.</p>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No escalations.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((e) => (
            <li
              key={e.id}
              className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3"
            >
              <p className="text-sm text-neutral-300">{e.messageText}</p>
              <p className="mt-1 text-xs text-neutral-500">
                {e.reason} · {e.status} · {new Date(e.createdAt).toLocaleString()}
              </p>
              <div className="mt-2 flex gap-2">
                {e.status !== "ACKNOWLEDGED" && (
                  <button
                    type="button"
                    disabled={updating === e.id}
                    onClick={() => updateStatus(e.id, "ACKNOWLEDGED")}
                    className="rounded border border-neutral-600 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700 disabled:opacity-50"
                  >
                    Acknowledge
                  </button>
                )}
                {e.status !== "RESOLVED" && (
                  <button
                    type="button"
                    disabled={updating === e.id}
                    onClick={() => updateStatus(e.id, "RESOLVED")}
                    className="rounded border border-neutral-600 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700 disabled:opacity-50"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
