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
