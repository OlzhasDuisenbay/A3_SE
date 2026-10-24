import { useMemo, useState } from "react";
import {
  Clock,
  DoorClosed,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Building2,
  Info,
  AlertTriangle,
} from "lucide-react";

// --- Time helpers (minutes-of-day 0..1440) ---

function minutesToLabel(m: number): string {
  if (m === 1440) return "24:00";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function timeValueToMinutes(v: string): number | null {
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function minutesToTimeValue(m: number): string {
  if (m >= 1440) return "23:59";
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

type Booking = [number, number];

// Overlap test: intervals touching at an endpoint do NOT overlap.
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export default function App() {
  // Default fictional local state per spec.
  const [now, setNow] = useState<number>(540);
  const [blocked, setBlocked] = useState<boolean>(false);
  const [existing, setExisting] = useState<Booking[]>([[600, 660]]);

  // Request inputs.
  const [startTime, setStartTime] = useState<string>("09:30");
  const [endAtMidnight, setEndAtMidnight] = useState<boolean>(false);
  const [endTime, setEndTime] = useState<string>("10:30");

  // New "now" override (for demo).
  const [nowInput, setNowInput] = useState<string>("09:00");

  // Allow user to add a booking manually (does not mutate via the check itself).
  const [addStart, setAddStart] = useState<string>("");
  const [addEnd, setAddEnd] = useState<string>("");

  const [result, setResult] = useState<"available" | "unavailable" | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  const startMin = timeValueToMinutes(startTime) ?? 0;
  const endMin = endAtMidnight ? 1440 : timeValueToMinutes(endTime) ?? 0;
  const duration = endMin - startMin;

  const sortedExisting = useMemo(
    () => [...existing].sort((a, b) => a[0] - b[0]),
    [existing]
  );

  function evaluate() {
    const errors: string[] = [];
    const boundsValid = startMin >= 0 && startMin < 1440 && endMin > 0 && endMin <= 1440;
    const orderValid = boundsValid && startMin < endMin;

    // AC1: bounds (0 <= start < end <= 1440) and start strictly after now
    if (startMin < 0 || startMin >= 1440) {
      errors.push(
        "Error: Start time must be between 00:00 and 23:59 (0 to 1439 minutes)."
      );
    }
    if (endMin <= 0 || endMin > 1440) {
      errors.push(
        "Error: End time must be between 00:01 and 24:00 (1 to 1440 minutes)."
      );
    }
    if (boundsValid && startMin >= endMin) {
      errors.push(
        "Error: Start time must be strictly earlier than end time."
      );
    }
    if (orderValid && startMin <= now) {
      errors.push(
        `Error: Start time must be strictly after the current time (${minutesToLabel(
          now
        )}). Your start is ${minutesToLabel(startMin)}.`
      );
    }

    // AC2: duration ≤ 120 minutes (120 is permitted)
    if (orderValid && duration > 120) {
      errors.push(
        `Error: Maximum duration of 120 minutes exceeded. Your slot is ${duration} minutes long.`
      );
    }

    // AC3: room blocked
    if (blocked) {
      errors.push(
        "Error: The selected room is currently blocked and no requests can be accepted."
      );
    }

    // AC4: overlap with existing bookings (endpoint touches are allowed)
    if (orderValid) {
      const conflict = existing.find(([bs, be]) =>
        overlaps(startMin, endMin, bs, be)
      );
      if (conflict) {
        errors.push(
          `Error: Time slot overlaps with an existing booking (${minutesToLabel(
            conflict[0]
          )}–${minutesToLabel(conflict[1])}). Slots that only touch at an endpoint are allowed.`
        );
      }
    }

    setMessages(errors);
    setResult(errors.length === 0 ? "available" : "unavailable");
  }

  function resetState() {
    setNow(540);
    setNowInput("09:00");
    setBlocked(false);
    setExisting([[600, 660]]);
    setStartTime("09:30");
    setEndTime("10:30");
    setEndAtMidnight(false);
    setAddStart("");
    setAddEnd("");
    setResult(null);
    setMessages([]);
  }

  function applyNow() {
    const m = timeValueToMinutes(nowInput);
    if (m !== null) setNow(m);
  }

  function addBooking() {
    const s = timeValueToMinutes(addStart);
    const e = timeValueToMinutes(addEnd);
    if (s === null || e === null || s >= e || s < 0 || e > 1440) return;
    setExisting((prev) => [...prev, [s, e]]);
    setAddStart("");
    setAddEnd("");
  }

  function removeBooking(index: number) {
    setExisting((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-slate-100 text-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Smart Campus Room Availability Checker
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Check whether a room is available for a requested time — no bookings
            are created or saved.
          </p>
        </header>

        {/* Room status card */}
        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <DoorClosed className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Room Library-204
                </p>
                <p className="text-xs text-slate-500">
                  Current time:{" "}
                  <span className="font-medium text-slate-700">
                    {minutesToLabel(now)}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBlocked((b) => !b)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                blocked
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              {blocked ? (
                <>
                  <Lock className="h-4 w-4" /> Blocked
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" /> Not blocked
                </>
              )}
            </button>
          </div>

          {/* Current time override (demo) */}
          <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Set current time (demo)
              </label>
              <input
                type="time"
                value={nowInput}
                onChange={(e) => setNowInput(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </div>
            <button
              type="button"
              onClick={applyNow}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetState}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Reset defaults
            </button>
          </div>
        </section>

        {/* Availability request */}
        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <Clock className="h-5 w-5 text-sky-600" /> Check a time slot
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <p className="mt-1 text-xs text-slate-400">
                Must be after {minutesToLabel(now)}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <Info className="h-3.5 w-3.5 shrink-0" />
                That's <span className="font-medium text-sky-600">{startMin}</span> min from midnight
                <span className="text-slate-300">·</span>
                {startMin} = {minutesToLabel(startMin)}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                End time
              </label>
              <input
                type="time"
                value={endTime}
                disabled={endAtMidnight}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setResult(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={endAtMidnight}
                  onChange={(e) => {
                    setEndAtMidnight(e.target.checked);
                    setResult(null);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                End at midnight (24:00)
              </label>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                <Info className="h-3.5 w-3.5 shrink-0" />
                That's <span className="font-medium text-sky-600">{endMin}</span> min from midnight
                <span className="text-slate-300">·</span>
                {endMin} = {minutesToLabel(endMin)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <div className="text-sm">
              <span className="text-slate-500">Slot: </span>
              <span className="font-semibold text-slate-800">
                {minutesToLabel(startMin)} – {minutesToLabel(endMin)}
              </span>
              <span className="ml-1 text-xs text-slate-400">
                ({startMin}–{endMin} min)
              </span>
            </div>
            <div className="text-sm">
              <span className="text-slate-500">Duration: </span>
              <span
                className={`font-semibold ${
                  duration > 120 ? "text-amber-600" : "text-slate-800"
                }`}
              >
                {duration} min
              </span>
            </div>
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Times are stored as minutes from midnight (0–1440). To convert:
            divide by 60 for the hour and use the remainder for minutes. For
            example, 540 min = 09:00 and 600 min = 10:00.
          </p>

          <button
            type="button"
            onClick={evaluate}
            className="mt-4 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 sm:w-auto sm:px-8"
          >
            Check availability
          </button>

          {/* Result */}
          {result && (
            <div className="mt-5">
              <div
                className={`flex items-center gap-3 rounded-xl p-4 ${
                  result === "available"
                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                    : "bg-red-50 text-red-800 ring-1 ring-red-200"
                }`}
              >
                {result === "available" ? (
                  <CheckCircle2 className="h-6 w-6 shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 shrink-0" />
                )}
                <div>
                  <p className="text-base font-bold">
                    {result === "available" ? "Available" : "Unavailable"}
                  </p>
                  <p className="text-sm opacity-80">
                    {result === "available"
                      ? `The room is free for ${minutesToLabel(
                          startMin
                        )}–${minutesToLabel(endMin)} (${duration} min).`
                      : "This slot cannot be booked. See the reasons below."}
                  </p>
                </div>
              </div>

              {messages.length > 0 && (
                <div className="mt-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    {messages.length} rule{messages.length > 1 ? "s" : ""} failed
                  </p>
                  <ul className="space-y-2">
                    {messages.map((m, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="font-medium">{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Existing bookings */}
        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
            <CalendarDays className="h-5 w-5 text-sky-600" /> Existing bookings
            <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {existing.length}
            </span>
          </h2>

          {sortedExisting.length === 0 ? (
            <p className="text-sm text-slate-400">No existing bookings.</p>
          ) : (
            <ul className="space-y-2">
              {sortedExisting.map(([s, e], i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-700">
                    {minutesToLabel(s)} – {minutesToLabel(e)}
                  </span>
                  <span className="text-slate-400">{e - s} min</span>
                  <button
                    type="button"
                    onClick={() => removeBooking(i)}
                    className="text-xs font-semibold text-slate-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add a booking manually */}
          <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Add start
              </label>
              <input
                type="time"
                value={addStart}
                onChange={(e) => setAddStart(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Add end
              </label>
              <input
                type="time"
                value={addEnd}
                onChange={(e) => setAddEnd(e.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={addBooking}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Add
            </button>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Adding or removing bookings here only updates the local list — the
            checker never modifies these bookings automatically.
          </p>
        </section>

        <footer className="text-center text-xs text-slate-400">
          Smart Campus Room Availability Checker · local demo data only
        </footer>
      </div>
    </div>
  );
}
