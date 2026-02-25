"use client";

import { useState, useEffect } from "react";

export function OrgKeyRef() {
  const [openaiKeyRef, setOpenaiKeyRef] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/org")
      .then((r) => r.json())
      .then((data) => {
        setOpenaiKeyRef(data.openaiKeyRef ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openaiKeyRef: openaiKeyRef.trim() || null }),
      });
      if (res.ok) {
        const data = await res.json();
        setOpenaiKeyRef(data.openaiKeyRef ?? "");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <h3 className="text-lg font-semibold text-white">Org API key (env ref)</h3>
      <p className="mt-1 text-sm text-neutral-500">Env var name only; the key value is never stored. Used for per-org billing.</p>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={openaiKeyRef}
          onChange={(e) => setOpenaiKeyRef(e.target.value)}
          placeholder="e.g. OPENAI_API_KEY_ORG_1"
          className="flex-1 rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
