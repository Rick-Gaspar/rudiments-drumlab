import { useSyncExternalStore } from "react";

export type LearningStatus = "not_started" | "learning" | "practiced";

export const STATUS_LABELS: Record<LearningStatus, string> = {
  not_started: "Não iniciado",
  learning: "Aprendendo",
  practiced: "Praticado",
};

/** Per-rudiment user data. BPM/lastPracticed are filled in Phase 2/3 only. */
export interface RudimentProgress {
  status: LearningStatus;
  personalBestBpm: number | null;
  lastPracticedAt: string | null;
}

type Store = Record<string, RudimentProgress>;
const KEY = "rudiment-lab:progress:v1";
const EMPTY: Store = {};
let cache: Store | null = null;
const listeners = new Set<() => void>();

function read(): Store {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "{}") as Store;
  } catch {
    cache = {};
  }
  return cache;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setStatus(id: string, status: LearningStatus) {
  const current = read();
  const prev = current[id] ?? { status: "not_started", personalBestBpm: null, lastPracticedAt: null };
  cache = { ...current, [id]: { ...prev, status } };
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export function useProgress(): Store {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function statusOf(store: Store, id: string): LearningStatus {
  return store[id]?.status ?? "not_started";
}

/* ---------- Saved practice sessions ---------- */

export interface PracticeSession {
  id: string;
  rudimentId: string;
  endedAt: string;
  durationMs: number;
  bpm: number;
}

/** Sessions shorter than this are not saved. */
export const MIN_SESSION_MS = 5000;

const SESSIONS_KEY = "rudiment-lab:sessions:v1";
const NO_SESSIONS: PracticeSession[] = [];
let sessionsCache: PracticeSession[] | null = null;

function readSessions(): PracticeSession[] {
  if (sessionsCache) return sessionsCache;
  try {
    sessionsCache = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]") as PracticeSession[];
  } catch {
    sessionsCache = [];
  }
  return sessionsCache;
}

/** Pure: applies a finished session to progress (status, best BPM, last practiced). */
export function applySession(progress: Store, s: PracticeSession): Store {
  const prev = progress[s.rudimentId] ?? { status: "not_started", personalBestBpm: null, lastPracticedAt: null };
  return {
    ...progress,
    [s.rudimentId]: {
      status: prev.status === "not_started" ? "learning" : prev.status,
      personalBestBpm: Math.max(prev.personalBestBpm ?? 0, s.bpm),
      lastPracticedAt: s.endedAt,
    },
  };
}

/** Saves a session; returns null if too short to count. */
export function saveSession(input: { rudimentId: string; durationMs: number; bpm: number }): PracticeSession | null {
  if (input.durationMs < MIN_SESSION_MS) return null;
  const s: PracticeSession = { ...input, durationMs: Math.round(input.durationMs), id: crypto.randomUUID(), endedAt: new Date().toISOString() };
  sessionsCache = [s, ...readSessions()];
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessionsCache));
  cache = applySession(read(), s);
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
  return s;
}

export function deleteSession(id: string) {
  sessionsCache = readSessions().filter((s) => s.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessionsCache));
  listeners.forEach((l) => l());
}

export function useSessions(): PracticeSession[] {
  return useSyncExternalStore(subscribe, readSessions, () => NO_SESSIONS);
}

export function totalMs(sessions: PracticeSession[], rudimentId?: string) {
  return sessions.reduce((t, s) => (!rudimentId || s.rudimentId === rudimentId ? t + s.durationMs : t), 0);
}
