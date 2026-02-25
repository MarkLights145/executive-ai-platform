"use client";

import { useState } from "react";

export function TelegramConfigSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Telegram configuration instructions
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
            Learn how to connect Telegram to Executive AI.
          </p>
        </div>
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-500 dark:bg-neutral-900/40 dark:text-neutral-400">
          Coming soon.
        </div>
      )}
    </div>
  );
}

