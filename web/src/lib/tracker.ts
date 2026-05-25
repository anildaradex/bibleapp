"use client";

/**
 * Client-side spiritual-journey tracker. Stores per-day reading time and
 * verse counts in localStorage so it works without a backend. When we add
 * accounts, this becomes a thin shim that also syncs to the server.
 */
export interface DayMeter {
  dayKey: string;        // "2026-05-25"
  minutesInWord: number;
  versesRead: number;
  chaptersRead: number;
  goalMinutes: number;
}

const KEY = "bibleapp.journeyMeters";
const GOAL_KEY = "bibleapp.dailyGoalMinutes";

export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getGoalMinutes(): number {
  if (typeof window === "undefined") return 15;
  const raw = window.localStorage.getItem(GOAL_KEY);
  return raw ? parseInt(raw, 10) || 15 : 15;
}

export function setGoalMinutes(min: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GOAL_KEY, String(min));
}

function load(): Record<string, DayMeter> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function save(meters: Record<string, DayMeter>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(meters));
}

export function todayMeter(): DayMeter {
  const key = dayKey();
  const all = load();
  return all[key] ?? {
    dayKey: key,
    minutesInWord: 0,
    versesRead: 0,
    chaptersRead: 0,
    goalMinutes: getGoalMinutes(),
  };
}

export function recordSession(durationSeconds: number, versesRead: number) {
  const key = dayKey();
  const all = load();
  const meter = all[key] ?? {
    dayKey: key,
    minutesInWord: 0,
    versesRead: 0,
    chaptersRead: 0,
    goalMinutes: getGoalMinutes(),
  };
  meter.minutesInWord += durationSeconds / 60;
  meter.versesRead += versesRead;
  meter.chaptersRead += 1;
  all[key] = meter;
  save(all);
}

export function recentMeters(days: number): DayMeter[] {
  const all = load();
  const out: DayMeter[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push(all[key] ?? {
      dayKey: key,
      minutesInWord: 0,
      versesRead: 0,
      chaptersRead: 0,
      goalMinutes: getGoalMinutes(),
    });
  }
  return out;
}

export function currentStreak(): number {
  const all = load();
  let streak = 0;
  const cursor = new Date();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const key = dayKey(cursor);
    const m = all[key];
    if (m && m.minutesInWord >= m.goalMinutes) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}
