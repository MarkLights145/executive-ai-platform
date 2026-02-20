"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

const PREFERENCES = [
  { id: "inbox_triage", label: "Inbox triage" },
  { id: "calendar", label: "Calendar & scheduling" },
  { id: "digests", label: "Daily digests" },
  { id: "reminders", label: "Reminders & follow-ups" },
  { id: "research", label: "Quick research" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 10;

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<"individual" | "organization">("individual");
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [featureRequest, setFeatureRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function togglePref(id: string) {
    setPreferences((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function validateStep2(): string | null {
    if (!name?.trim()) return "Name is required.";
    const e = email.trim();
    if (!e) return "Email is required.";
    if (!EMAIL_RE.test(e)) return "Please enter a valid email address.";
    if (password.length < MIN_PASSWORD_LENGTH) return "Password must be at least 10 characters.";
    if (password !== confirmPassword) return "Passwords don’t match.";
    return null;
  }

  async function handleSubmit() {
    setError("");
    const step2Err = validateStep2();
    if (step2Err) {
      setError(step2Err);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          organizationName: kind === "organization" ? organizationName : undefined,
          name,
          email: email.trim(),
          password,
          telegramUsername: telegramUsername || undefined,
          preferences: preferences.length ? preferences : undefined,
          featureRequest: featureRequest || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      await signIn("credentials", {
        email: email.trim(),
        password,
        callbackUrl: "/app",
        redirect: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold text-white">
            Executive AI
          </Link>
          <span className="text-sm text-neutral-500">Step {step} of 4</span>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-6">
          {step === 1 && (
            <>
              <h2 className="text-lg font-semibold text-white">Individual or organization?</h2>
              <p className="mt-1 text-sm text-neutral-400">We’ll create the right setup for you.</p>
              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setKind("individual")}
                  className={`flex-1 rounded-lg border py-3 px-4 text-left text-sm font-medium ${
                    kind === "individual"
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-neutral-700 text-neutral-300 hover:border-neutral-600"
                  }`}
                >
                  Individual
                </button>
                <button
                  type="button"
                  onClick={() => setKind("organization")}
                  className={`flex-1 rounded-lg border py-3 px-4 text-left text-sm font-medium ${
                    kind === "organization"
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-neutral-700 text-neutral-300 hover:border-neutral-600"
                  }`}
                >
                  Organization
                </button>
              </div>
              {kind === "organization" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-300">Organization name</label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Acme Inc."
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
                  />
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-white">Your details</h2>
              <p className="mt-1 text-sm text-neutral-400">Name, email, and a secure password for your account.</p>
              {error && (
                <p className="mt-4 rounded-lg border border-red-500 bg-red-500/20 px-4 py-3 text-sm font-medium text-red-300" role="alert">
                  {error}
                </p>
              )}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
                    placeholder="jane@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={MIN_PASSWORD_LENGTH}
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
                    placeholder="At least 10 characters"
                  />
                  <p className="mt-1.5 text-xs text-neutral-500">
                    Your password is hashed and never stored in plain text. We recommend at least 10 characters for security.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={MIN_PASSWORD_LENGTH}
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
                    placeholder="Re-enter your password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">
                    Telegram username <span className="text-neutral-500">(optional, coming soon)</span>
                  </label>
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    placeholder="@username"
                    className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold text-white">What do you want from your assistant?</h2>
              <p className="mt-1 text-sm text-neutral-400">Select all that apply.</p>
              <div className="mt-6 space-y-2">
                {PREFERENCES.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-700 py-2.5 px-3 hover:border-neutral-600"
                  >
                    <input
                      type="checkbox"
                      checked={preferences.includes(p.id)}
                      onChange={() => togglePref(p.id)}
                      className="rounded border-neutral-600 accent-amber-500"
                    />
                    <span className="text-sm text-neutral-200">{p.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-neutral-300">Feature request (optional)</label>
                <textarea
                  value={featureRequest}
                  onChange={(e) => setFeatureRequest(e.target.value)}
                  rows={3}
                  placeholder="What would make Executive AI indispensable for you?"
                  className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
                />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-lg font-semibold text-white">Review and create account</h2>
              <p className="mt-1 text-sm text-neutral-400">We’ll create your account and sign you in. You can update preferences anytime in Settings.</p>
              <dl className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Type</dt>
                  <dd className="text-neutral-200">{kind === "organization" ? "Organization" : "Individual"}</dd>
                </div>
                {kind === "organization" && organizationName && (
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Organization</dt>
                    <dd className="text-neutral-200">{organizationName}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Name</dt>
                  <dd className="text-neutral-200">{name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Email</dt>
                  <dd className="text-neutral-200">{email}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Password</dt>
                  <dd className="text-neutral-200">••••••••</dd>
                </div>
                {preferences.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-neutral-500">Interests</dt>
                    <dd className="text-neutral-200">{preferences.join(", ")}</dd>
                  </div>
                )}
              </dl>
            </>
          )}

          {error && (
            <p className="mt-6 text-sm text-red-400" role="alert">{error}</p>
          )}

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => { setError(""); setStep((s) => Math.max(1, s - 1)); }}
              disabled={step === 1}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white disabled:opacity-40"
            >
              Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  try {
                    setError("");
                    if (step === 2) {
                      const err = validateStep2();
                      if (err) {
                        setError(err);
                        return;
                      }
                    }
                    setStep((s) => s + 1);
                  } catch (e) {
                    setError("Something went wrong. Please check your entries and try again.");
                  }
                }}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
