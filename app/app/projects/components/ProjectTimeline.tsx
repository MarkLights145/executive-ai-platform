"use client";

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

type TimelineProps = {
  projectName: string;
  projectType?: string | null;
  dates: TimelineDates;
};

type TimelineItem = {
  key: string;
  label: string;
  date: string;
  color: string;
};

export function ProjectTimeline({ projectName, projectType, dates }: TimelineProps) {
  const items: TimelineItem[] = [];

  if (dates.loadInStart) {
    items.push({
      key: "loadInStart",
      label: "Load-in start",
      date: dates.loadInStart,
      color: "bg-sky-500",
    });
  }
  if (dates.loadInEnd) {
    items.push({
      key: "loadInEnd",
      label: "Load-in end",
      date: dates.loadInEnd,
      color: "bg-sky-400",
    });
  }
  if (dates.eventStart) {
    items.push({
      key: "eventStart",
      label: "Event start",
      date: dates.eventStart,
      color: "bg-emerald-500",
    });
  }
  if (dates.eventEnd) {
    items.push({
      key: "eventEnd",
      label: "Event end",
      date: dates.eventEnd,
      color: "bg-emerald-400",
    });
  }
  if (dates.loadOutStart) {
    items.push({
      key: "loadOutStart",
      label: "Load-out start",
      date: dates.loadOutStart,
      color: "bg-amber-500",
    });
  }
  if (dates.loadOutEnd) {
    items.push({
      key: "loadOutEnd",
      label: "Load-out end",
      date: dates.loadOutEnd,
      color: "bg-amber-400",
    });
  }
  if (dates.truckLoad) {
    items.push({
      key: "truckLoad",
      label: "Truck load",
      date: dates.truckLoad,
      color: "bg-indigo-500",
    });
  }
  if (dates.truckReturn) {
    items.push({
      key: "truckReturn",
      label: "Truck back",
      date: dates.truckReturn,
      color: "bg-indigo-400",
    });
  }

  const sorted = items.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Timeline
          </h2>
          <p className="mt-1 text-sm text-neutral-700">
            {projectType
              ? `${projectType} — ${projectName}`
              : projectName}
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">
          No dates set yet. Add event, load-in, load-out, and truck dates in the project
          details section.
        </p>
      ) : (
        <div className="mt-5">
          <div className="relative h-2 rounded-full bg-neutral-100">
            <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
              {sorted.map((item) => (
                <div
                  key={item.key}
                  className="flex -translate-y-3 flex-col items-center text-center"
                >
                  <div
                    className={`h-3 w-3 rounded-full ${item.color} ring-2 ring-white shadow`}
                  />
                  <span className="mt-2 max-w-[5.5rem] text-xs font-medium text-neutral-700">
                    {item.label}
                  </span>
                  <span className="mt-0.5 text-xs text-neutral-500">
                    {formatDate(item.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

