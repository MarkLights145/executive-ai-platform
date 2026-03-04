"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "../actions";

type TimelineDates = {
  eventStart?: string | null;
  eventEnd?: string | null;
  loadInStart?: string | null;
  loadInEnd?: string | null;
  loadOutStart?: string | null;
  loadOutEnd?: string | null;
  truckLoad?: string | null;
  truckReturn?: string | null;
};

export function ProjectDetailsForm({
  projectId,
  initialName,
  initialDescription,
  projectType,
  dates,
}: {
  projectId: string;
  initialName: string;
  initialDescription?: string | null;
  projectType?: string | null;
  dates: TimelineDates;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [type, setType] = useState(projectType ?? "");

  const [eventStart, setEventStart] = useState(
    dates.eventStart ? dates.eventStart.slice(0, 10) : ""
  );
  const [eventEnd, setEventEnd] = useState(
    dates.eventEnd ? dates.eventEnd.slice(0, 10) : ""
  );
  const [loadInStart, setLoadInStart] = useState(
    dates.loadInStart ? dates.loadInStart.slice(0, 10) : ""
  );
  const [loadInEnd, setLoadInEnd] = useState(
    dates.loadInEnd ? dates.loadInEnd.slice(0, 10) : ""
  );
  const [loadOutStart, setLoadOutStart] = useState(
    dates.loadOutStart ? dates.loadOutStart.slice(0, 10) : ""
  );
  const [loadOutEnd, setLoadOutEnd] = useState(
    dates.loadOutEnd ? dates.loadOutEnd.slice(0, 10) : ""
  );
  const [truckLoad, setTruckLoad] = useState(
    dates.truckLoad ? dates.truckLoad.slice(0, 10) : ""
  );
  const [truckReturn, setTruckReturn] = useState(
    dates.truckReturn ? dates.truckReturn.slice(0, 10) : ""
  );

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    startTransition(async () => {
      try {
        await updateProject(projectId, {
          name: name.trim(),
          description: description.trim() || null,
          projectType: type.trim() || null,
          eventStart: eventStart || null,
          eventEnd: eventEnd || null,
          loadInStart: loadInStart || null,
          loadInEnd: loadInEnd || null,
          loadOutStart: loadOutStart || null,
          loadOutEnd: loadOutEnd || null,
          truckLoad: truckLoad || null,
          truckReturn: truckReturn || null,
        });
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to update project details"
        );
      }
    });
  };

  return (
    <section className="mt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          Edit project details
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-3 space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-500">
                Project name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <label className="mt-3 block text-xs font-medium text-neutral-500">
                Project type
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. festival, conference, tour"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <label className="mt-3 block text-xs font-medium text-neutral-500">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Timeline
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
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "../actions";

type TimelineDates = {
  eventStart?: string | null;
  eventEnd?: string | null;
  loadInStart?: string | null;
  loadInEnd?: string | null;
  loadOutStart?: string | null;
  loadOutEnd?: string | null;
  truckLoad?: string | null;
  truckReturn?: string | null;
};

export function ProjectDetailsForm({
  projectId,
  initialName,
  initialDescription,
  projectType,
  dates,
}: {
  projectId: string;
  initialName: string;
  initialDescription?: string | null;
  projectType?: string | null;
  dates: TimelineDates;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [type, setType] = useState(projectType ?? "");

  const [eventStart, setEventStart] = useState(
    dates.eventStart ? dates.eventStart.slice(0, 10) : ""
  );
  const [eventEnd, setEventEnd] = useState(
    dates.eventEnd ? dates.eventEnd.slice(0, 10) : ""
  );
  const [loadInStart, setLoadInStart] = useState(
    dates.loadInStart ? dates.loadInStart.slice(0, 10) : ""
  );
  const [loadInEnd, setLoadInEnd] = useState(
    dates.loadInEnd ? dates.loadInEnd.slice(0, 10) : ""
  );
  const [loadOutStart, setLoadOutStart] = useState(
    dates.loadOutStart ? dates.loadOutStart.slice(0, 10) : ""
  );
  const [loadOutEnd, setLoadOutEnd] = useState(
    dates.loadOutEnd ? dates.loadOutEnd.slice(0, 10) : ""
  );
  const [truckLoad, setTruckLoad] = useState(
    dates.truckLoad ? dates.truckLoad.slice(0, 10) : ""
  );
  const [truckReturn, setTruckReturn] = useState(
    dates.truckReturn ? dates.truckReturn.slice(0, 10) : ""
  );

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    startTransition(async () => {
      try {
        await updateProject(projectId, {
          name: name.trim(),
          description: description.trim() || null,
          projectType: type.trim() || null,
          eventStart: eventStart || null,
          eventEnd: eventEnd || null,
          loadInStart: loadInStart || null,
          loadInEnd: loadInEnd || null,
          loadOutStart: loadOutStart || null,
          loadOutEnd: loadOutEnd || null,
          truckLoad: truckLoad || null,
          truckReturn: truckReturn || null,
        });
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to update project details"
        );
      }
    });
  };

  return (
    <section className="mt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          Edit project details
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-3 space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-500">
                Project name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <label className="mt-3 block text-xs font-medium text-neutral-500">
                Project type
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. festival, conference, tour"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <label className="mt-3 block text-xs font-medium text-neutral-500">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Timeline
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
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save changes"}
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}
    </section>
  );
}

