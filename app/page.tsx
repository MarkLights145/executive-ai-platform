import Link from "next/link";
import { ROICalculator } from "./components/ROICalculator";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">Executive AI</span>
          <nav className="flex gap-6">
            <Link href="/login" className="text-neutral-400 hover:text-white">
              Sign in
            </Link>
            <Link
              href="/onboard"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-200"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <span className="mb-4 inline-block rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            Beta
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Full power of AI, safely. Without the complexity.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
            Executive AI gives you a single, trusted assistant for your inbox, calendar, and decisions—so you focus on what matters.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/onboard"
              className="w-full rounded-full bg-white px-8 py-3 text-center font-medium text-black hover:bg-neutral-200 sm:w-auto"
            >
              Start onboarding
            </Link>
            <Link
              href="/login"
              className="w-full rounded-full border border-neutral-600 px-8 py-3 text-center font-medium text-neutral-300 hover:border-neutral-500 hover:text-white sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-y border-neutral-800 bg-neutral-900/50 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-semibold text-white">Security-first. Enterprise-ready.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-400">
              Your data stays yours. We use encryption, strict access controls, and advisory mode by default so you stay in control.
            </p>
            <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
              {["Encryption at rest and in transit", "You approve before actions", "No training on your data"].map(
                (item) => (
                  <li key={item} className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-4 text-sm text-neutral-300">
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-2xl font-semibold text-white">See the impact</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-neutral-400">
              Reclaimed time and faster decisions—valued in your terms.
            </p>
            <ROICalculator />
          </div>
        </section>

        <section className="border-t border-neutral-800 px-6 py-16">
          <div className="mx-auto max-w-6xl text-center">
            <p className="text-sm text-neutral-500">
              Limited functions during beta. Join the newsletter for updates.
            </p>
            <Link
              href="/onboard"
              className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black hover:bg-neutral-200"
            >
              Get started
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
