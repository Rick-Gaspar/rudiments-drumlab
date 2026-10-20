import { z } from "zod";

/** Pure session model: types, validation and derived metrics. No I/O here. */

export const SCHEMA_VERSION = 1;
export const BPM_MIN = 20;
export const BPM_MAX = 300;
export const MIN_DURATION_MS = 5_000;
export const MAX_DURATION_MS = 6 * 3_600_000;
export const NOTES_MAX = 500;

export interface PracticeSession {
  id: string;
  rudimentId: string;
  /** ISO timestamp of when the session started. */
  startedAt: string;
  durationMs: number;
  startBpm: number | null;
  finalBpm: number;
  /** Highest clean BPM — user-reported, never measured. */
  cleanBpm: number | null;
  notes: string;
  /** Perceived difficulty 1 (fácil) – 5 (muito difícil). */
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export type SessionInput = Omit<PracticeSession, "id" | "createdAt" | "updatedAt">;

const bpm = z.number().int().min(BPM_MIN).max(BPM_MAX);
const iso = z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Data inválida");

export const sessionInputSchema = z.object({
  rudimentId: z.string().min(1),
  startedAt: iso,
  durationMs: z.number().int().min(MIN_DURATION_MS).max(MAX_DURATION_MS),
  startBpm: bpm.nullable(),
  finalBpm: bpm,
  cleanBpm: bpm.nullable(),
  notes: z.string().max(NOTES_MAX),
  rating: z.number().int().min(1).max(5).nullable(),
});

export const sessionSchema = sessionInputSchema.extend({ id: z.string().min(1), createdAt: iso, updatedAt: iso });

/* ---------- Form <-> input ---------- */

export interface SessionFormValues {
  rudimentId: string;
  /** datetime-local value, local time: YYYY-MM-DDTHH:mm */
  startedAt: string;
  minutes: string;
  seconds: string;
  startBpm: string;
  finalBpm: string;
  cleanBpm: string;
  notes: string;
  rating: string;
}

export type FormErrors = Partial<Record<keyof SessionFormValues, string>>;

const pad = (n: number) => String(n).padStart(2, "0");
export function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toFormValues(s: Partial<SessionInput> & { rudimentId: string }): SessionFormValues {
  const total = Math.round((s.durationMs ?? 0) / 1000);
  const str = (n: number | null | undefined) => (n == null ? "" : String(n));
  return {
    rudimentId: s.rudimentId,
    startedAt: toLocalInput(s.startedAt ? new Date(s.startedAt) : new Date()),
    minutes: String(Math.floor(total / 60)),
    seconds: String(total % 60),
    startBpm: str(s.startBpm),
    finalBpm: str(s.finalBpm),
    cleanBpm: str(s.cleanBpm),
    notes: s.notes ?? "",
    rating: str(s.rating),
  };
}

export function parseForm(v: SessionFormValues, now = new Date()): { ok: true; input: SessionInput } | { ok: false; errors: FormErrors } {
  const errors: FormErrors = {};
  const intOrNull = (raw: string, key: keyof SessionFormValues, required: boolean, min: number, max: number, label: string) => {
    const t = raw.trim();
    if (!t) {
      if (required) errors[key] = `${label} é obrigatório.`;
      return null;
    }
    const n = Number(t);
    if (!Number.isInteger(n) || n < min || n > max) {
      errors[key] = `${label}: use um número inteiro entre ${min} e ${max}.`;
      return null;
    }
    return n;
  };

  if (!v.rudimentId) errors.rudimentId = "Escolha um rudimento.";
  const date = v.startedAt ? new Date(v.startedAt) : null;
  if (!date || Number.isNaN(date.getTime())) errors.startedAt = "Informe data e hora válidas.";
  else if (date.getTime() > now.getTime() + 60_000) errors.startedAt = "A data não pode estar no futuro.";
  else if (date.getFullYear() < 2000) errors.startedAt = "Data muito antiga.";

  const min = intOrNull(v.minutes || "0", "minutes", true, 0, MAX_DURATION_MS / 60000, "Minutos");
  const sec = intOrNull(v.seconds || "0", "seconds", true, 0, 59, "Segundos");
  const durationMs = ((min ?? 0) * 60 + (sec ?? 0)) * 1000;
  if (!errors.minutes && !errors.seconds) {
    if (durationMs < MIN_DURATION_MS) errors.minutes = `A duração mínima é ${MIN_DURATION_MS / 1000} segundos.`;
    else if (durationMs > MAX_DURATION_MS) errors.minutes = "A duração máxima é 6 horas.";
  }

  const startBpm = intOrNull(v.startBpm, "startBpm", false, BPM_MIN, BPM_MAX, "BPM inicial");
  const finalBpm = intOrNull(v.finalBpm, "finalBpm", true, BPM_MIN, BPM_MAX, "BPM final");
  const cleanBpm = intOrNull(v.cleanBpm, "cleanBpm", false, BPM_MIN, BPM_MAX, "BPM limpo");
  const rating = intOrNull(v.rating, "rating", false, 1, 5, "Dificuldade");
  const notes = v.notes.trim();
  if (notes.length > NOTES_MAX) errors.notes = `Máximo de ${NOTES_MAX} caracteres.`;

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    input: { rudimentId: v.rudimentId, startedAt: date!.toISOString(), durationMs, startBpm, finalBpm: finalBpm!, cleanBpm, notes, rating },
  };
}

/* ---------- Derived metrics ---------- */

export function totalMs(sessions: readonly PracticeSession[], rudimentId?: string) {
  return sessions.reduce((t, s) => (!rudimentId || s.rudimentId === rudimentId ? t + s.durationMs : t), 0);
}

export interface RudimentStats {
  count: number;
  totalMs: number;
  lastPracticedAt: string | null;
  bestCleanBpm: number | null;
}

export function rudimentStats(sessions: readonly PracticeSession[], rudimentId: string): RudimentStats {
  const st: RudimentStats = { count: 0, totalMs: 0, lastPracticedAt: null, bestCleanBpm: null };
  for (const s of sessions) {
    if (s.rudimentId !== rudimentId) continue;
    st.count++;
    st.totalMs += s.durationMs;
    if (!st.lastPracticedAt || s.startedAt > st.lastPracticedAt) st.lastPracticedAt = s.startedAt;
    if (s.cleanBpm != null && (st.bestCleanBpm == null || s.cleanBpm > st.bestCleanBpm)) st.bestCleanBpm = s.cleanBpm;
  }
  return st;
}

/** Local calendar day key YYYY-MM-DD. */
export function dayKey(d: Date | string) {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export interface SessionFilter {
  /** Inclusive local dates YYYY-MM-DD. */
  from?: string;
  to?: string;
  rudimentId?: string;
}

export function filterSessions(sessions: readonly PracticeSession[], f: SessionFilter) {
  return sessions.filter((s) => {
    const k = dayKey(s.startedAt);
    return (!f.rudimentId || s.rudimentId === f.rudimentId) && (!f.from || k >= f.from) && (!f.to || k <= f.to);
  });
}

/**
 * Streak = number of consecutive local calendar days with at least one session,
 * ending today, or ending yesterday if nothing was practiced yet today.
 */
export function streakDays(sessions: readonly PracticeSession[], now = new Date()) {
  const days = new Set(sessions.map((s) => dayKey(s.startedAt)));
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function sortByDateDesc(sessions: readonly PracticeSession[]) {
  return [...sessions].sort((a, b) => (a.startedAt < b.startedAt ? 1 : a.startedAt > b.startedAt ? -1 : 0));
}

/** Per-day totals for charting, ascending by day. */
export function dailySeries(sessions: readonly PracticeSession[]) {
  const map = new Map<string, { day: string; minutes: number; cleanBpm: number | null }>();
  for (const s of sessions) {
    const k = dayKey(s.startedAt);
    const e = map.get(k) ?? { day: k, minutes: 0, cleanBpm: null };
    e.minutes += s.durationMs / 60000;
    if (s.cleanBpm != null) e.cleanBpm = Math.max(e.cleanBpm ?? 0, s.cleanBpm);
    map.set(k, e);
  }
  return [...map.values()].sort((a, b) => (a.day < b.day ? -1 : 1)).map((e) => ({ ...e, minutes: Math.round(e.minutes * 10) / 10 }));
}

/* ---------- Export / import ---------- */

export const CSV_FIELDS = [
  "id", "rudiment_id", "rudiment_name", "started_at", "duration_seconds", "start_bpm",
  "final_bpm", "clean_bpm_user_reported", "difficulty_rating", "notes", "created_at", "updated_at",
] as const;

export function csvCell(v: string | number | null) {
  if (v == null) return "";
  let s = String(v);
  // Neutralise spreadsheet formula injection in text fields.
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(sessions: readonly PracticeSession[], nameOf: (id: string) => string) {
  const rows = sessions.map((s) =>
    [s.id, s.rudimentId, nameOf(s.rudimentId), s.startedAt, Math.round(s.durationMs / 1000), s.startBpm, s.finalBpm, s.cleanBpm, s.rating, s.notes, s.createdAt, s.updatedAt]
      .map(csvCell)
      .join(","),
  );
  return [CSV_FIELDS.join(","), ...rows].join("\r\n") + "\r\n";
}

export const BACKUP_APP = "rudiment-lab";

export function toBackup(sessions: readonly PracticeSession[], now = new Date()) {
  return { app: BACKUP_APP, schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), sessions };
}

const backupSchema = z.object({
  app: z.literal(BACKUP_APP),
  schemaVersion: z.literal(SCHEMA_VERSION),
  exportedAt: iso,
  sessions: z.array(sessionSchema),
});

export function parseBackup(text: string, validRudimentIds: ReadonlySet<string>): { ok: true; sessions: PracticeSession[] } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "O arquivo não é um JSON válido." };
  }
  const r = backupSchema.safeParse(raw);
  if (!r.success) return { ok: false, error: "O arquivo não é um backup válido do Rudiment Lab (versão ou campos incorretos)." };
  const bad = r.data.sessions.find((s) => !validRudimentIds.has(s.rudimentId));
  if (bad) return { ok: false, error: `Rudimento desconhecido no backup: ${bad.rudimentId}.` };
  return { ok: true, sessions: r.data.sessions };
}

/** Import never overwrites: new ids are added, identical ones skipped, differing ones reported as conflicts. */
export function planImport(existing: readonly PracticeSession[], incoming: readonly PracticeSession[]) {
  const byId = new Map(existing.map((s) => [s.id, s]));
  const toAdd: PracticeSession[] = [];
  let duplicates = 0;
  let conflicts = 0;
  const seen = new Set<string>();
  for (const s of incoming) {
    if (seen.has(s.id)) { duplicates++; continue; }
    seen.add(s.id);
    const cur = byId.get(s.id);
    if (!cur) toAdd.push(s);
    else if (JSON.stringify(cur) === JSON.stringify(s)) duplicates++;
    else conflicts++;
  }
  return { toAdd, duplicates, conflicts };
}
