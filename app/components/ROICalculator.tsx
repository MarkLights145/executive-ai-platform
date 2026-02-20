"use client";

import { useState } from "react";

const COMP_RANGES = [
  { label: "Under $200k", value: 150 },
  { label: "$200k – $500k", value: 350 },
  { label: "$500k – $1M", value: 750 },
  { label: "$1M+", value: 1200 },
];

export function ROICalculator() {
  const [meetingsReclaimed, setMeetingsReclaimed] = useState(3);
  const [focusHours, setFocusHours] = useState(5);
  const [latencyDays, setLatencyDays] = useState(2);
  const [compIndex, setCompIndex] = useState(1);
  const [strategicMultiplier, setStrategicMultiplier] = useState(2);

  const compK = COMP_RANGES[compIndex]?.value ?? 350;
  const hourlyValue = (compK * 1000) / 2080;
  const strategicHour = hourlyValue * strategicMultiplier;
  const meetingValue = (meetingsReclaimed * 0.5) * strategicHour * 4;
  const focusValue = focusHours * strategicHour * 4;
  const latencyValue = latencyDays * 2 * strategicHour;
  const monthly = meetingValue + focusValue + latencyValue;
  const annual = monthly * 12;

  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-neutral-700 bg-neutral-900/80 p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-300">Meetings reclaimed per week</label>
          <input
            type="range"
            min={0}
            max={10}
            value={meetingsReclaimed}
            onChange={(e) => setMeetingsReclaimed(Number(e.target.value))}
            className="mt-1 w-full accent-amber-500"
          />
          <span className="ml-2 text-sm text-neutral-400">{meetingsReclaimed}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300">Focus hours reclaimed per week</label>
          <input
            type="range"
            min={0}
            max={20}
            value={focusHours}
            onChange={(e) => setFocusHours(Number(e.target.value))}
            className="mt-1 w-full accent-amber-500"
          />
          <span className="ml-2 text-sm text-neutral-400">{focusHours}</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300">Decision latency reduced (days → hours)</label>
          <input
            type="range"
            min={0}
            max={7}
            value={latencyDays}
            onChange={(e) => setLatencyDays(Number(e.target.value))}
            className="mt-1 w-full accent-amber-500"
          />
          <span className="ml-2 text-sm text-neutral-400">{latencyDays} days</span>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300">Annual comp / revenue responsibility range</label>
          <select
            value={compIndex}
            onChange={(e) => setCompIndex(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-neutral-200"
          >
            {COMP_RANGES.map((r, i) => (
              <option key={r.label} value={i}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300">Value of one strategic hour (× base hourly)</label>
          <input
            type="range"
            min={1}
            max={5}
            step={0.5}
            value={strategicMultiplier}
            onChange={(e) => setStrategicMultiplier(Number(e.target.value))}
            className="mt-1 w-full accent-amber-500"
          />
          <span className="ml-2 text-sm text-neutral-400">×{strategicMultiplier}</span>
        </div>
      </div>
      <div className="mt-8 border-t border-neutral-700 pt-6">
        <p className="text-sm text-neutral-400">Estimated annual value (illustrative)</p>
        <p className="mt-1 text-3xl font-semibold text-amber-400">
          ${(annual / 1000).toFixed(0)}k
        </p>
      </div>
    </div>
  );
}
