"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "../actions";

export function CreateProjectForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [loadInStart, setLoadInStart] = useState("");
  const [loadInEnd, setLoadInEnd] = useState("");
  const [loadOutStart, setLoadOutStart] = useState("");
  const [loadOutEnd, setLoadOutEnd] = useState("");
  const [truckLoad, setTruckLoad] = useState("");
  const [truckReturn, setTruckReturn] = useState("");
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function resetForm() {
    setOpen(false);
    setError(null);
    setName("");
    setDescription("");
    setProjectType("");
    setEventStart("");
    setEventEnd("");
    setLoadInStart("");
    setLoadInEnd("");
    setLoadOutStart("");
    setLoadOutEnd("");
    setTruckLoad("");
    setTruckReturn("");
    setStep(0);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    startTransition(async () => {
      try {
        const projectId = await createProject(name.trim(), description.trim() || undefined, {
          projectType: projectType.trim() || undefined,
          eventStart: eventStart || null,
          eventEnd: eventEnd || null,
          loadInStart: loadInStart || null,
          loadInEnd: loadInEnd || null,
          loadOutStart: loadOutStart || null,
          loadOutEnd: loadOutEnd || null,
          truckLoad: truckLoad || null,
          truckReturn: truckReturn || null,
        });
        resetForm();
        router.push(`/app/projects/${projectId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create project");
      }
    });
  }

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
        >
          + New project
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              {["Basics", "Event dates", "Load-in", "Load-out", "Truck"][step]}
            </p>
            <p className="text-xs text-neutral-400">
              Step {step + 1} of 5
            </p>
          </div>

          {step === 0 && (
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                autoFocus
              />
              <input
                type="text"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder="Project type (e.g. festival, conference)"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                Event dates. You can leave these blank if you do not know yet.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-500">
                    Event start
                  </label>
                  <input
                    type="date"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500">
                    Event end
                  </label>
                  <input
                    type="date"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                Load-in window for the show.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-500">
                    Load-in start
                  </label>
                  <input
                    type="date"
                    value={loadInStart}
                    onChange={(e) => setLoadInStart(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500">
                    Load-in end
                  </label>
                  <input
                    type="date"
                    value={loadInEnd}
                    onChange={(e) => setLoadInEnd(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                Load-out window after the event.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-500">
                    Load-out start
                  </label>
                  <input
                    type="date"
                    value={loadOutStart}
                    onChange={(e) => setLoadOutStart(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500">
                    Load-out end
                  </label>
                  <input
                    type="date"
                    value={loadOutEnd}
                    onChange={(e) => setLoadOutEnd(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600">
                Truck movements for this project.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-500">
                    Truck load date
                  </label>
                  <input
                    type="date"
                    value={truckLoad}
                    onChange={(e) => setTruckLoad(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500">
                    Truck back date
                  </label>
                  <input
                    type="date"
                    value={truckReturn}
                    onChange={(e) => setTruckReturn(e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Back
                </button>
              )}
              {step < 4 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(4, s + 1))}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Next
                </button>
              )}
              {step === 4 && (
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isPending ? "Creating…" : "Create project"}
                </button>
              )}
            </div>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      )}
    </div>
  );
}
