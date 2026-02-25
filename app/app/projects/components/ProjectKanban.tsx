"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createProjectTask,
  updateProjectTask,
  pingProjectTask,
  setTaskStatusResponse,
} from "../actions";

const COLUMNS: { id: "todo" | "in_progress" | "done"; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

type ColId = "todo" | "in_progress" | "done";

const COLUMN_STYLES: Record<ColId, { bg: string; border: string; badge: string; heading: string }> = {
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

export type ProjectTaskForKanban = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  assigneeId?: string;
  assignee?: { id: string; name: string | null; email: string };
  lastStatusResponse?: string;
  lastStatusAt?: string;
  lastPingedAt?: string;
};

type OrgUser = { id: string; name: string | null; email: string };

export function ProjectKanban({
  projectId,
  projectName,
  tasks,
  orgUsers,
}: {
  projectId: string;
  projectName: string;
  tasks: ProjectTaskForKanban[];
  orgUsers: OrgUser[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addingTask, setAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [responseTaskId, setResponseTaskId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const openResponseForm = (task: ProjectTaskForKanban) => {
    setResponseTaskId(task.id);
    setResponseText(task.lastStatusResponse ?? "");
  };

  const moveTask = (taskId: string, newStatus: "todo" | "in_progress" | "done") => {
    startTransition(async () => {
      await updateProjectTask(taskId, { status: newStatus });
      router.refresh();
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    startTransition(async () => {
      await createProjectTask(projectId, newTitle.trim(), newDescription.trim() || undefined);
      setNewTitle("");
      setNewDescription("");
      setAddingTask(false);
      router.refresh();
    });
  };

  const handleAssign = (taskId: string, assigneeId: string | null) => {
    startTransition(async () => {
      await updateProjectTask(taskId, { assigneeId: assigneeId || null });
      router.refresh();
    });
  };

  const handlePing = (taskId: string) => {
    startTransition(async () => {
      await pingProjectTask(taskId);
      router.refresh();
    });
  };

  const handleSetResponse = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    startTransition(async () => {
      await setTaskStatusResponse(taskId, responseText);
      setResponseTaskId(null);
      setResponseText("");
      router.refresh();
    });
  };

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const openEdit = (task: ProjectTaskForKanban) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
  };
  const handleSaveEdit = (e: React.FormEvent, taskId: string) => {
    e.preventDefault();
    startTransition(async () => {
      await updateProjectTask(taskId, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
      });
      setEditingTaskId(null);
      router.refresh();
    });
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Tasks</h2>
        {!addingTask ? (
          <button
            type="button"
            onClick={() => setAddingTask(true)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            + Add task
          </button>
        ) : (
          <form onSubmit={handleAddTask} className="flex flex-wrap items-end gap-2">
<input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title"
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
          />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Details (optional)"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
            >
              {isPending ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => { setAddingTask(false); setNewTitle(""); setNewDescription(""); }}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 dark:border-neutral-600 dark:text-neutral-300"
            >
              Cancel
            </button>
          </form>
        )}
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
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentColumnId={col.id}
                      columns={COLUMNS}
                      orgUsers={orgUsers}
                      isPending={isPending}
                      editingTaskId={editingTaskId}
                      editTitle={editTitle}
                      editDescription={editDescription}
                      setEditTitle={setEditTitle}
                      setEditDescription={setEditDescription}
                      openEdit={() => openEdit(task)}
                      onSaveEdit={(e) => handleSaveEdit(e, task.id)}
                      onCancelEdit={() => setEditingTaskId(null)}
                      responseTaskId={responseTaskId}
                      setResponseTaskId={setResponseTaskId}
                      responseText={responseText}
                      setResponseText={setResponseText}
                      openResponseForm={() => openResponseForm(task)}
                      onMove={(newStatus) => moveTask(task.id, newStatus)}
                      onAssign={(assigneeId) => handleAssign(task.id, assigneeId)}
                      onPing={() => handlePing(task.id)}
                      onSetResponse={(e) => handleSetResponse(e, task.id)}
                    />
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

function TaskCard({
  task,
  currentColumnId,
  columns,
  orgUsers,
  isPending,
  editingTaskId,
  editTitle,
  editDescription,
  setEditTitle,
  setEditDescription,
  openEdit,
  onSaveEdit,
  onCancelEdit,
  responseTaskId,
  setResponseTaskId,
  responseText,
  setResponseText,
  openResponseForm,
  onMove,
  onAssign,
  onPing,
  onSetResponse,
}: {
  task: ProjectTaskForKanban;
  currentColumnId: ColId;
  columns: { id: ColId; label: string }[];
  orgUsers: OrgUser[];
  isPending: boolean;
  editingTaskId: string | null;
  editTitle: string;
  editDescription: string;
  setEditTitle: (s: string) => void;
  setEditDescription: (s: string) => void;
  openEdit: () => void;
  onSaveEdit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  responseTaskId: string | null;
  setResponseTaskId: (id: string | null) => void;
  responseText: string;
  setResponseText: (s: string) => void;
  openResponseForm: () => void;
  onMove: (newStatus: ColId) => void;
  onAssign: (assigneeId: string | null) => void;
  onPing: () => void;
  onSetResponse: (e: React.FormEvent) => void;
}) {
  const isEditing = editingTaskId === task.id;
  const isResponding = responseTaskId === task.id;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-600 dark:bg-neutral-800">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <form onSubmit={onSaveEdit} className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded border border-neutral-200 px-2 py-1 text-sm font-medium dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                placeholder="Title"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full rounded border border-neutral-200 px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                placeholder="Details (optional)"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-neutral-800 px-2 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
                >
                  Save
                </button>
                <button type="button" onClick={onCancelEdit} className="rounded border border-neutral-200 px-2 py-1 text-xs font-medium dark:border-neutral-600 dark:text-neutral-300">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{task.title}</p>
              {task.description && (
                <p className="mt-1 text-sm text-neutral-500 line-clamp-2 dark:text-neutral-400">{task.description}</p>
              )}
              <button
                type="button"
                onClick={openEdit}
                className="mt-1 text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                Edit details
              </button>
            </>
          )}
        </div>
      </div>
      {!isEditing && (
        <div className="mt-3">
          <select
            value=""
            onChange={(e) => {
              const v = e.target.value as ColId;
              if (v) onMove(v);
              e.target.value = "";
            }}
            disabled={isPending}
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-3 pr-8 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
            aria-label="Move task to column"
          >
            <option value="">Move to…</option>
            {columns.filter((c) => c.id !== currentColumnId).map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Assignee */}
      <div className="mt-3">
        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400">Assigned to</label>
        <select
          value={task.assigneeId ?? ""}
          onChange={(e) => onAssign(e.target.value || null)}
          disabled={isPending}
          className="mt-0.5 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
        >
          <option value="">Unassigned</option>
          {orgUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email}
            </option>
          ))}
        </select>
      </div>

      {/* Ping & Last response */}
      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={onPing}
          disabled={isPending}
          className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/50"
        >
          Ping for status
        </button>
        {task.lastPingedAt && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pinged {new Date(task.lastPingedAt).toLocaleString()}
          </p>
        )}
        {task.lastStatusResponse && (
          <div className="rounded bg-neutral-50 p-2 text-xs dark:bg-neutral-700/50">
            <p className="font-medium text-neutral-600 dark:text-neutral-300">Last response:</p>
            <p className="mt-0.5 text-neutral-700 dark:text-neutral-200">{task.lastStatusResponse}</p>
            {task.lastStatusAt && (
              <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                {new Date(task.lastStatusAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
        {!isResponding ? (
          <button
            type="button"
            onClick={openResponseForm}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {task.lastStatusResponse ? "Update status response" : "Add status response"}
          </button>
        ) : (
          <form onSubmit={onSetResponse} className="mt-2">
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Status update from assignee..."
              rows={2}
              className="w-full rounded border border-neutral-200 px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
            />
            <div className="mt-1 flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded bg-neutral-800 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setResponseTaskId(null); setResponseText(""); }}
                className="rounded border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600 dark:border-neutral-600 dark:text-neutral-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
