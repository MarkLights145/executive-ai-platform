"use client";

import { useState, useEffect } from "react";

export type Task = {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  description?: string;
  source?: "openclaw" | "local";
};

const COLUMNS: { id: Task["status"]; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

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

  const moveTask = (taskId: string, newStatus: Task["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    // TODO: PATCH /api/tasks when backend supports updates; or sync to OpenClaw
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
          <h2 className="text-lg font-semibold text-neutral-900">Kanban</h2>
          <p className="text-sm text-neutral-500">
            {openclawConnected ? "Synced with OpenClaw" : "Add tasks below or connect OpenClaw in Settings to sync."}
          </p>
        </div>
        <button
          type="button"
          onClick={addTask}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
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
              className="flex flex-col rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-700">{col.label}</h3>
                <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  {colTasks.length}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <p className="py-6 text-center text-sm text-neutral-400">No tasks</p>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                    >
                      <p className="font-medium text-neutral-900">{task.title}</p>
                      {task.description && (
                        <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{task.description}</p>
                      )}
                      {task.source === "openclaw" && (
                        <span className="mt-2 inline-block text-xs text-amber-600">OpenClaw</span>
                      )}
                      <div className="mt-3 flex gap-2">
                        {col.id !== "todo" && (
                          <button
                            type="button"
                            onClick={() => moveTask(task.id, col.id === "in_progress" ? "todo" : "in_progress")}
                            className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
                          >
                            ← Move
                          </button>
                        )}
                        {col.id !== "done" && (
                          <button
                            type="button"
                            onClick={() => moveTask(task.id, col.id === "todo" ? "in_progress" : "done")}
                            className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
                          >
                            Move →
                          </button>
                        )}
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
