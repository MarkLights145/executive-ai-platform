"use client";

import { useState, useEffect } from "react";

type AgentInstance = {
  id: string;
  name: string;
  baseUrl: string;
  authTokenRef: string;
  enabled: boolean;
};

export function ExecutionPlaneCard({ orgId }: { orgId: string }) {
  const [instances, setInstances] = useState<AgentInstance[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ outputText?: string; error?: string } | null>(null);
  const [form, setForm] = useState({ name: "", baseUrl: "", authTokenRef: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/execution/agent-instances")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data.instances) ? data.instances : [];
          setInstances(list);
          setSelectedInstanceId((prev) =>
            list.some((i: AgentInstance) => i.id === prev) ? prev : list[0]?.id ?? null
          );
        }
      })
      .catch(() => {
        if (!cancelled) setInstances([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAddAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.baseUrl.trim() || !form.authTokenRef.trim()) return;
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch("/api/execution/agent-instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          baseUrl: form.baseUrl.trim(),
          authTokenRef: form.authTokenRef.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ error: data.error ?? "Failed to add agent" });
        return;
      }
      setInstances((prev) => [...prev, { ...data, id: data.id }]);
      setForm({ name: "", baseUrl: "", authTokenRef: "" });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    const agent = instances.find((i) => i.id === selectedInstanceId) ?? instances[0];
    if (!agent) {
      setResult({ error: "Add an agent instance first." });
      return;
    }
    setTesting(true);
    setResult(null);
    try {
      const createRes = await fetch("/api/execution/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          agentInstanceId: agent.id,
          actorRole: "ADMIN",
          messageText: "ping",
        }),
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        setResult({ error: createData.error ?? "Failed to create job" });
        return;
      }
      const jobId = createData.jobId;
      if (!jobId) {
        setResult({ error: "No jobId returned" });
        return;
      }
      const maxAttempts = 10; // 10s total to meet Phase 1.5 exit criteria
      for (let i = 0; i < maxAttempts; i++) {
        const jobRes = await fetch(`/api/execution/jobs/${jobId}`);
        const jobData = await jobRes.json().catch(() => ({}));
        if (!jobRes.ok) {
          setResult({ error: jobData.error ?? "Failed to get job status" });
          return;
        }
        if (jobData.status === "DONE") {
          setResult({ outputText: jobData.resultText ?? "(no output)" });
          return;
        }
        if (jobData.status === "ERROR") {
          setResult({ error: jobData.errorText ?? "Job failed" });
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
      setResult({ error: "Timed out waiting for job" });
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  const firstInstance = instances.length > 0 ? instances[0] : null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      {firstInstance === null ? (
        <form onSubmit={handleAddAgent} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-500">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. LUTN Agent"
              className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500">Base URL</label>
            <input
              type="text"
              value={form.baseUrl}
              onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              placeholder="http://100.x.y.z:18790"
              className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500">Auth token env key</label>
            <input
              type="text"
              value={form.authTokenRef}
              onChange={(e) => setForm((f) => ({ ...f, authTokenRef: e.target.value }))}
              placeholder="e.g. OPENCLAW_EXEC_AUTH_TOKEN"
              className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Submit"}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          {instances.length > 1 ? (
            <div>
              <label className="block text-xs font-medium text-neutral-500">Agent instance</label>
              <select
                value={selectedInstanceId ?? ""}
                onChange={(e) => setSelectedInstanceId(e.target.value || null)}
                className="mt-1 w-full rounded border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-white"
              >
                {instances.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-300">
                <span className="font-medium text-neutral-500">Instance name: </span>
                {firstInstance.name}
              </p>
              <p className="text-sm text-neutral-300">
                <span className="font-medium text-neutral-500">Base URL: </span>
                {firstInstance.baseUrl}
              </p>
            </>
          )}
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
          >
            {testing ? "Testing…" : "Test Agent Connection"}
          </button>
        </div>
      )}

      {result !== null && (
        <div className="mt-4 rounded-lg border border-neutral-700 bg-neutral-800/50 p-3">
          {result.error ? (
            <p className="text-sm text-red-400">{result.error}</p>
          ) : (
            <p className="text-sm text-neutral-300">
              <span className="font-medium text-neutral-500">Response: </span>
              {result.outputText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
