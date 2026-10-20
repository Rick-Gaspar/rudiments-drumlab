import type { PracticeSession } from "./model";

/**
 * Storage port for sessions. The IndexedDB implementation below is the only one
 * today; a cloud-backed implementation can replace it later.
 */
export interface SessionRepository {
  list(): Promise<PracticeSession[]>;
  put(s: PracticeSession): Promise<void>;
  putMany(s: PracticeSession[]): Promise<void>;
  remove(id: string): Promise<void>;
}

const DB_NAME = "rudiment-lab";
/** Bump with an upgrade step in onupgradeneeded when the stored shape changes. */
const DB_VERSION = 1;
const STORE = "sessions";

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB indisponível neste navegador."));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (e.oldVersion < 1) {
        const st = db.createObjectStore(STORE, { keyPath: "id" });
        st.createIndex("startedAt", "startedAt");
        st.createIndex("rudimentId", "rudimentId");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Falha ao abrir o armazenamento."));
    req.onblocked = () => reject(new Error("Armazenamento bloqueado por outra aba. Feche-a e tente de novo."));
  }).catch((e) => {
    dbPromise = null;
    throw e;
  });
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, fn: (st: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error ?? new Error("Falha ao gravar."));
    t.onabort = () => reject(t.error ?? new Error("Gravação cancelada (espaço insuficiente?)."));
  });
}

export const indexedDbRepository: SessionRepository = {
  async list() {
    return ((await tx("readonly", (st) => st.getAll())) ?? []) as PracticeSession[];
  },
  async put(s) {
    await tx("readwrite", (st) => void st.put(s));
  },
  async putMany(list) {
    await tx("readwrite", (st) => void list.forEach((s) => st.put(s)));
  },
  async remove(id) {
    await tx("readwrite", (st) => void st.delete(id));
  },
};
