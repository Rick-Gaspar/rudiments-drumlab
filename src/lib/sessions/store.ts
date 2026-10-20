import { useSyncExternalStore } from "react";
import { sessionSchema, sortByDateDesc, type PracticeSession, type SessionInput, sessionInputSchema } from "./model";
import { indexedDbRepository, type SessionRepository } from "./repository";

export type SessionsState =
  | { status: "loading"; sessions: readonly PracticeSession[]; error: null }
  | { status: "ready"; sessions: readonly PracticeSession[]; error: null }
  | { status: "error"; sessions: readonly PracticeSession[]; error: string };

const repo: SessionRepository = indexedDbRepository;
const LOADING: SessionsState = { status: "loading", sessions: [], error: null };
let state: SessionsState = LOADING;
let started = false;
const listeners = new Set<() => void>();

function set(next: SessionsState) {
  state = next;
  listeners.forEach((l) => l());
}

const msg = (e: unknown) => (e instanceof Error ? e.message : "Erro desconhecido ao acessar o armazenamento.");

/** One-time migration of the old localStorage (v1) sessions into IndexedDB. */
async function migrateLegacy() {
  const KEY = "rudiment-lab:sessions:v1";
  const raw = localStorage.getItem(KEY);
  if (!raw) return;
  try {
    const old = JSON.parse(raw) as { id: string; rudimentId: string; endedAt: string; durationMs: number; bpm: number }[];
    const migrated = old
      .map((o) => ({
        id: o.id, rudimentId: o.rudimentId,
        startedAt: new Date(Date.parse(o.endedAt) - o.durationMs).toISOString(),
        durationMs: Math.round(o.durationMs), startBpm: null, finalBpm: o.bpm, cleanBpm: null,
        notes: "", rating: null, createdAt: o.endedAt, updatedAt: o.endedAt,
      }))
      .filter((s) => sessionSchema.safeParse(s).success);
    await repo.putMany(migrated);
  } catch {
    return; // keep the legacy key so nothing is lost
  }
  localStorage.removeItem(KEY);
}

export async function loadSessions() {
  set({ ...state, status: "loading", error: null } as SessionsState);
  try {
    await migrateLegacy();
    set({ status: "ready", sessions: sortByDateDesc(await repo.list()), error: null });
  } catch (e) {
    set({ status: "error", sessions: state.sessions, error: msg(e) });
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!started) {
    started = true;
    void loadSessions();
  }
  return () => listeners.delete(cb);
}

export function useSessionsState(): SessionsState {
  return useSyncExternalStore(subscribe, () => state, () => LOADING);
}

export function useSessions() {
  return useSessionsState().sessions;
}

/** Resolves only after the write is committed; throws on failure. */
export async function createSession(input: SessionInput): Promise<PracticeSession> {
  const now = new Date().toISOString();
  const s: PracticeSession = { ...sessionInputSchema.parse(input), id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  await repo.put(s);
  set({ status: "ready", sessions: sortByDateDesc([s, ...state.sessions]), error: null });
  return s;
}

export async function updateSession(id: string, input: SessionInput): Promise<PracticeSession> {
  const prev = state.sessions.find((s) => s.id === id);
  if (!prev) throw new Error("Sessão não encontrada.");
  const s: PracticeSession = { ...prev, ...sessionInputSchema.parse(input), updatedAt: new Date().toISOString() };
  await repo.put(s);
  set({ status: "ready", sessions: sortByDateDesc(state.sessions.map((x) => (x.id === id ? s : x))), error: null });
  return s;
}

export async function deleteSession(id: string) {
  await repo.remove(id);
  set({ status: "ready", sessions: state.sessions.filter((s) => s.id !== id), error: null });
}

export async function importSessions(list: PracticeSession[]) {
  await repo.putMany(list);
  set({ status: "ready", sessions: sortByDateDesc([...list, ...state.sessions]), error: null });
}
