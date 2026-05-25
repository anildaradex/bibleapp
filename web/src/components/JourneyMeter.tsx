"use client";

import { useEffect, useState } from "react";
import { currentStreak, recentMeters, todayMeter, type DayMeter } from "@/lib/tracker";

export function JourneyMeter() {
  const [today, setToday] = useState<DayMeter | null>(null);
  const [streak, setStreak] = useState(0);
  const [heat, setHeat] = useState<DayMeter[]>([]);

  useEffect(() => {
    setToday(todayMeter());
    setStreak(currentStreak());
    setHeat(recentMeters(28));
  }, []);

  const progress = today
    ? Math.min(1, today.minutesInWord / Math.max(1, today.goalMinutes))
    : 0;
  const circumference = 2 * Math.PI * 90;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="220" height="220" viewBox="0 0 220 220">
        <circle cx="110" cy="110" r="90"
                stroke="currentColor" strokeOpacity="0.15"
                strokeWidth="14" fill="none" />
        <circle cx="110" cy="110" r="90"
                stroke="var(--accent)" strokeWidth="14" fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 110 110)"
                style={{ transition: "stroke-dashoffset 0.6s ease-out" }} />
        <text x="110" y="106" textAnchor="middle"
              className="font-ui"
              fontSize="34" fontWeight="600" fill="currentColor">
          {Math.round(today?.minutesInWord ?? 0)} / {today?.goalMinutes ?? 15}
        </text>
        <text x="110" y="130" textAnchor="middle"
              className="font-ui"
              fontSize="11" fill="var(--muted)">
          min in the Word today
        </text>
      </svg>

      <div className="font-ui text-sm">
        <span className="text-[var(--accent)] font-semibold">{streak}</span>
        <span className="text-[var(--muted)]"> day streak</span>
      </div>

      <p className="italic text-center text-[var(--muted)] max-w-md">
        &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo; — Psalm 119:105
      </p>

      <div className="w-full max-w-md">
        <div className="font-ui text-xs text-[var(--muted)] mb-2">Last 4 weeks</div>
        <div className="grid grid-cols-7 gap-1">
          {heat.map(m => (
            <div key={m.dayKey}
                 title={`${m.dayKey} — ${m.minutesInWord.toFixed(1)} min`}
                 className="aspect-square rounded"
                 style={{
                   backgroundColor: "var(--accent)",
                   opacity: 0.15 + 0.85 *
                     Math.min(1, m.minutesInWord / Math.max(1, m.goalMinutes)),
                 }} />
          ))}
        </div>
      </div>
    </div>
  );
}
