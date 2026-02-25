"use client";

import { useState, useEffect } from "react";

type UsageLog = {
  id: string;
  jobId: string | null;
  inputTokens: number;
  outputTokens: number;
  costEstimateCents: number | null;
  createdAt: string;
};

type Summary = {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostCents: number;
  count: number;
};

export function UsageDashboard() {
  const [usage, setUsage] = useState<UsageLog[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.usage)) setUsage(data.usage);
        if (data.summary) setSummary(data.summary);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h3 className="text-lg font-semibold text-white">Usage</h3>
        <p className="mt-2 text-sm text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <h3 className="text-lg font-semibold text-white">Usage</h3>
      <p className="mt-1 text-sm text-neutral-500">Per-org usage (tokens and cost). Keys are never stored in plaintext.</p>
      {summary && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3">
            <p className="text-xs text-neutral-500">Input tokens</p>
            <p className="text-lg font-medium text-white">{summary.totalInputTokens.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3">
            <p className="text-xs text-neutral-500">Output tokens</p>
            <p className="text-lg font-medium text-white">{summary.totalOutputTokens.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3">
            <p className="text-xs text-neutral-500">Est. cost</p>
            <p className="text-lg font-medium text-white">${(summary.totalCostCents / 100).toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3">
            <p className="text-xs text-neutral-500">Records</p>
            <p className="text-lg font-medium text-white">{summary.count}</p>
          </div>
        </div>
      )}
      {usage.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No usage records yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-700 text-left text-neutral-500">
                <th className="pb-2 pr-4">Time</th>
                <th className="pb-2 pr-4">Input</th>
                <th className="pb-2 pr-4">Output</th>
                <th className="pb-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {usage.slice(0, 50).map((l) => (
                <tr key={l.id} className="border-b border-neutral-800 text-neutral-300">
                  <td className="py-1 pr-4">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="py-1 pr-4">{l.inputTokens}</td>
                  <td className="py-1 pr-4">{l.outputTokens}</td>
                  <td className="py-1">{l.costEstimateCents != null ? `$${(l.costEstimateCents / 100).toFixed(4)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
