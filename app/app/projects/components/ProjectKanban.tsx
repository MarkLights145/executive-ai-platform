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
        <h2 className="text-lg font-semibold text-neutral-900">Tasks</h2>
        {!addingTask ? (
          <button
            type="button"
            onClick={() => setAddingTask(true)}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
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
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Details (optional)"
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isPending ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              onClick={() => { setAddingTask(false); setNewTitle(""); setNewDescription(""); }}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700"
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
                    <TaskCard
                      key={task.id}
                      task={task}
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
                      onMoveLeft={
                        col.id !== "todo"
                          ? () => moveTask(task.id, col.id === "in_progress" ? "todo" : "in_progress")
                          : undefined
                      }
                      onMoveRight={
                        col.id !== "done"
                          ? () =>
                              moveTask(task.id, col.id === "todo" ? "in_progress" : "done")
                          : undefined
                      }
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
  onMoveLeft,
  onMoveRight,
  onAssign,
  onPing,
  onSetResponse,
}: {
  task: ProjectTaskForKanban;
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
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  onAssign: (assigneeId: string | null) => void;
  onPing: () => void;
  onSetResponse: (e: React.FormEvent) => void;
}) {
  const isEditing = editingTaskId === task.id;
  const isResponding = responseTaskId === task.id;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <form onSubmit={onSaveEdit} className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded border border-neutral-200 px-2 py-1 text-sm font-medium"
                placeholder="Title"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full rounded border border-neutral-200 px-2 py-1 text-sm"
                placeholder="Details (optional)"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded bg-neutral-800 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                >
                  Save
                </button>
                <button type="button" onClick={onCancelEdit} className="rounded border border-neutral-200 px-2 py-1 text-xs font-medium">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="font-medium text-neutral-900">{task.title}</p>
              {task.description && (
                <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{task.description}</p>
              )}
              <button
                type="button"
                onClick={openEdit}
                className="mt-1 text-xs font-medium text-neutral-500 hover:text-neutral-700"
              >
                Edit details
              </button>
            </>
          )}
        </div>
        {!isEditing && (
        <div className="flex shrink-0 gap-1">
          {onMoveLeft && (
            <button
              type="button"
              onClick={onMoveLeft}
              disabled={isPending}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
            >
              ←
            </button>
          )}
          {onMoveRight && (
            <button
              type="button"
              onClick={onMoveRight}
              disabled={isPending}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
            >
              →
            </button>
          )}
        </div>
        )}
      </div>

      {/* Assignee */}
      <div className="mt-3">
        <label className="block text-xs font-medium text-neutral-500">Assigned to</label>
        <select
          value={task.assigneeId ?? ""}
          onChange={(e) => onAssign(e.target.value || null)}
          disabled={isPending}
          className="mt-0.5 w-full rounded border border-neutral-200 bg-white px-2 py-1.5 text-sm"
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
          className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
        >
          Ping for status
        </button>
        {task.lastPingedAt && (
          <p className="text-xs text-neutral-500">
            Pinged {new Date(task.lastPingedAt).toLocaleString()}
          </p>
        )}
        {task.lastStatusResponse && (
          <div className="rounded bg-neutral-50 p-2 text-xs">
            <p className="font-medium text-neutral-600">Last response:</p>
            <p className="mt-0.5 text-neutral-700">{task.lastStatusResponse}</p>
            {task.lastStatusAt && (
              <p className="mt-1 text-neutral-500">
                {new Date(task.lastStatusAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
        {!isResponding ? (
          <button
            type="button"
            onClick={openResponseForm}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-700"
          >
            {task.lastStatusResponse ? "Update status response" : "Add status response"}
          </button>
        ) : (
          <form onSubmit={onSetResponse} className="mt-2">
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Status update from assignee…”
              rows={2}
              className="w-full rounded border border-neutral-200 px-2 py-1.5 text-sm"
            />
            <div className="mt-1 flex gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded bg-neutral-800 px-2 py-1 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setResponseTaskId(null); setResponseText(""); }}
                className="rounded border border-neutral-200 px-2 py-1 text-xs font-medium text-neutral-600"
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
