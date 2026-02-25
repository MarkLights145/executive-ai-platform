"use client";

import { useState, useEffect } from "react";

export type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  description?: string;
  source?: "openclaw" | "local";
  projectId?: string;
  projectName?: string;
};

const COLUMNS: { id: Task["status"]; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

const COLUMN_STYLES: Record<Task["status"], { bg: string; border: string; badge: string; heading: string }> = {
  todo: {
    bg: "bg-blue-50/80 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200",
    heading: "text-blue-800 dark:text-blue-200",
  },
  in_progress: {
    bg: "bg-amber-50/80 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200",
    heading: "text-amber-800 dark:text-amber-200",
  },
  done: {
    bg: "bg-emerald-50/80 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    badge: "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200",
    heading: "text-emerald-800 dark:text-emerald-200",
  },
};

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [openclawConnected, setOpenclawConnected] = useState(false);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.ok ? res.json() : { tasks: [] })
      .then((data) => {
        setTasks(data.tasks ?? []);
        setOpenclawConnected((data.tasks ?? []).some((t: Task) => t.source === "openclaw"));
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  const moveTask = async (taskId: string, newStatus: Task["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (!taskId.startsWith("local-")) {
      try {
        await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch {
        // Optimistic update kept; user can refresh if needed
      }
    }
  };

  const addTask = () => {
    const title = window.prompt("New task title");
    if (!title?.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        title: title.trim(),
        status: "todo",
        source: "local",
      },
    ]);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-neutral-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Kanban</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {openclawConnected ? "Synced with OpenClaw" : "Add tasks below or connect OpenClaw in Settings to sync."}
          </p>
        </div>
        <button
          type="button"
          onClick={addTask}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          + Add task
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl border p-4 ${COLUMN_STYLES[col.id].border} ${COLUMN_STYLES[col.id].bg}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${COLUMN_STYLES[col.id].heading}`}>{col.label}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLUMN_STYLES[col.id].badge}`}>
                  {colTasks.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <p className="py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">No tasks</p>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-600 dark:bg-neutral-800"
                    >
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">{task.title}</p>
                      {(task as Task).projectName && (
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">From: {(task as Task).projectName}</p>
                      )}
                      {task.description && (
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">{task.description}</p>
                      )}
                      {task.source === "openclaw" && (
                        <span className="mt-2 inline-block text-xs text-amber-600 dark:text-amber-400">OpenClaw</span>
                      )}
                      <div className="mt-3">
                        <select
                          value=""
                          onChange={(e) => {
                            const v = e.target.value as Task["status"];
                            if (v) moveTask(task.id, v);
                            e.target.value = "";
                          }}
                          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-3 pr-8 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                          aria-label="Move task to column"
                        >
                          <option value="">Move to…</option>
                          {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
