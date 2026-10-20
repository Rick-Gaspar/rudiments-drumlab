import { useSyncExternalStore } from "react";

export type LearningStatus = "not_started" | "learning" | "practiced";

export const STATUS_LABELS: Record<LearningStatus, string> = {
  not_started: "Não iniciado",
  learning: "Aprendendo",
  practiced: "Praticado",
};

/** Manually chosen learning status per rudiment. Session metrics live in src/lib/sessions. */
export interface RudimentProgress {
  status: LearningStatus;
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
  cache = { ...current, [id]: { ...current[id], status } };
  localStorage.setItem(KEY, JSON.stringify(cache));
  listeners.forEach((l) => l());
}

export function useProgress(): Store {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** Effective status: a rudiment with saved sessions is at least "learning". */
export function statusOf(store: Store, id: string, sessionCount = 0): LearningStatus {
  const s = store[id]?.status ?? "not_started";
  return s === "not_started" && sessionCount > 0 ? "learning" : s;
}
