"use client";

import { useEffect, useState } from "react";

function msUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

/** Time left in today's deals, in the shopper's local time. Placeholders until mounted. */
export function Countdown() {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMs(msUntilMidnight());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const parts =
    ms === null
      ? ["--", "--", "--"]
      : [ms / 3_600_000, (ms / 60_000) % 60, (ms / 1000) % 60].map((n) => Math.floor(n).toString().padStart(2, "0"));

  return (
    <div className="flex items-center gap-1.5" role="timer" aria-label="Time left in today's deals">
      {parts.map((value, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="min-w-[4.25rem] overflow-clip rounded-md bg-white/[0.06] px-3 py-2.5 text-center ring-1 ring-inset ring-white/10">
            <span key={value} className="block font-mono text-3xl font-medium tabular-nums tracking-tight animate-in fade-in slide-in-from-top-2 duration-300">
              {value}
            </span>
            <span className="label-mono mt-0.5 block text-[10px] text-white/40">{["hrs", "min", "sec"][i]}</span>
          </div>
          {i < 2 && <span className="font-mono text-2xl text-primary">:</span>}
        </div>
      ))}
    </div>
  );
}
