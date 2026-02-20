"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "executive-ai-bookmark-prompt-dismissed";

export function BookmarkPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!localStorage.getItem(STORAGE_KEY));
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
      setVisible(false);
    } catch {
      setVisible(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/90 px-5 py-4 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>
        <div>
          <p className="font-medium text-amber-900">Don’t lose this page</p>
          <p className="text-sm text-amber-800/90">
            Bookmark or add to favorites so you can get back to your dashboard anytime.{" "}
            <span className="font-medium text-amber-900">
              <span className="inline sm:hidden">Star icon in the address bar</span>
              <span className="hidden sm:inline">⌘D</span>
              <span className="hidden sm:inline md:inline"> or Ctrl+D</span>
            </span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 rounded-xl bg-amber-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-800"
      >
        Got it
      </button>
    </div>
  );
}
