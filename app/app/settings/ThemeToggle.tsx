"use client";

import { useTheme } from "@/app/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Appearance
      </h2>
      <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
        Choose light or dark mode for the app.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            theme === "light"
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
              : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          }`}
        >
          Light
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            theme === "dark"
              ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
              : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
          }`}
        >
          Dark
        </button>
      </div>
    </div>
  );
}
