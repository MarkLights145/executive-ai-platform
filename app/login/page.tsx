"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    if (res?.url) window.location.href = res.url;
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-6">
      <h1 className="text-xl font-semibold text-white">Sign in</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Use your email and password to access your dashboard.
      </p>
      <form onSubmit={handleCredentials} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white py-2.5 font-medium text-black hover:bg-neutral-200 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="mt-6 border-t border-neutral-700 pt-6">
        <p className="text-sm text-neutral-500">Coming soon</p>
        <button
          type="button"
          disabled
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 py-2.5 text-neutral-500 cursor-not-allowed"
        >
          <span>Sign in with Microsoft</span>
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-lg font-semibold text-white">
            Executive AI
          </Link>
        </div>
        <Suspense fallback={<div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-6 h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link href="/" className="hover:text-neutral-400">Back to home</Link>
          {" · "}
          <Link href="/onboard" className="hover:text-neutral-400">Create account</Link>
        </p>
      </div>
    </div>
  );
}
