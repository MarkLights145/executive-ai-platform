"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddAdminButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setCode(null);
    setLoading(true);
    try {
      const res = await fetch("/api/invite-codes?role=ADMIN", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Failed to generate code");
        return;
      }
      setCode(data.code);
      setExpiresAt(data.expiresAt ?? null);
      setOrganizationName(data.organizationName ?? null);
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!code) return;
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/onboard`;
    navigator.clipboard.writeText(
      `${code}\n\nSign up at: ${url}\nClick "Sign up with invite code", enter the code, and they'll join ${organizationName ?? "your organization"} as an admin.`
    );
  }

  function copyCodeOnly() {
    if (!code) return;
    navigator.clipboard.writeText(code);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setCode(null);
          setError(null);
        }}
        className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-900 shadow-sm transition hover:bg-amber-100"
      >
        Add admin
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-neutral-900">Invite an admin</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Generate a one-time code to invite another admin to your organization.
            </p>
            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
            {!code ? (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {loading ? "Generating…" : "Generate admin invite code"}
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                  <p className="text-xs font-medium text-neutral-500">Admin invite code</p>
                  <p className="mt-1 font-mono text-xl tracking-widest text-neutral-900">{code}</p>
                  {expiresAt && (
                    <p className="mt-2 text-xs text-neutral-500">
                      Expires {new Date(expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <p className="text-sm text-neutral-600">
                  Send this code to the new admin. They go to the onboarding page, click{" "}
                  <strong>Sign up with invite code</strong>, enter the code, then complete their details.
                  They&apos;ll join as an <strong>admin</strong> for{" "}
                  {organizationName ?? "your organization"}.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyCodeOnly}
                    className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Copy code
                  </button>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                  >
                    Copy code + instructions
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
                >
                  Generate another code
                </button>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCode(null);
                  router.refresh();
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

