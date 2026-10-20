import { describe, expect, it } from "vitest";
import {
  csvCell, filterSessions, parseBackup, parseForm, planImport, rudimentStats, streakDays, toBackup, toCsv, totalMs,
  toFormValues, type PracticeSession,
} from "@/lib/sessions/model";
import { statusOf } from "@/lib/practice-store";

const s = (o: Partial<PracticeSession>): PracticeSession => ({
  id: "x", rudimentId: "flam", startedAt: "2026-10-16T15:00:00.000Z", durationMs: 60000, startBpm: null,
  finalBpm: 60, cleanBpm: null, notes: "", rating: null, createdAt: "2026-10-16T15:01:00.000Z", updatedAt: "2026-10-16T15:01:00.000Z", ...o,
});

describe("session metrics", () => {
  it("sums time per rudiment", () => {
    expect(totalMs([s({}), s({ rudimentId: "flam-tap" }), s({ durationMs: 30000 })], "flam")).toBe(90000);
  });
  it("personal best is the highest user-reported clean BPM", () => {
    const st = rudimentStats([s({ cleanBpm: 80 }), s({ cleanBpm: 95, finalBpm: 120 }), s({ cleanBpm: null })], "flam");
    expect(st.bestCleanBpm).toBe(95);
    expect(st.count).toBe(3);
  });
  it("no sessions means no best BPM", () => {
    expect(rudimentStats([], "flam")).toEqual({ count: 0, totalMs: 0, lastPracticedAt: null, bestCleanBpm: null });
  });
  it("a rudiment with sessions is at least learning", () => {
    expect(statusOf({}, "flam", 1)).toBe("learning");
    expect(statusOf({ flam: { status: "practiced" } }, "flam", 1)).toBe("practiced");
  });
  it("filters by rudiment and inclusive date range", () => {
    const list = [s({ id: "a", startedAt: new Date(2026, 9, 1, 12).toISOString() }), s({ id: "b", startedAt: new Date(2026, 9, 5, 12).toISOString() }), s({ id: "c", rudimentId: "drag", startedAt: new Date(2026, 9, 5, 12).toISOString() })];
    expect(filterSessions(list, { from: "2026-10-05", to: "2026-10-05", rudimentId: "flam" }).map((x) => x.id)).toEqual(["b"]);
    expect(filterSessions(list, { to: "2026-10-04" }).map((x) => x.id)).toEqual(["a"]);
  });
  it("streak counts consecutive days ending today or yesterday", () => {
    const now = new Date(2026, 9, 20, 10);
    const at = (d: number) => s({ startedAt: new Date(2026, 9, d, 9).toISOString() });
    expect(streakDays([at(19), at(18), at(16)], now)).toBe(2);
    expect(streakDays([at(20), at(19)], now)).toBe(2);
    expect(streakDays([at(17)], now)).toBe(0);
  });
});

describe("session form validation", () => {
  const base = toFormValues({ rudimentId: "flam", durationMs: 65000, finalBpm: 90, startedAt: "2026-10-16T15:00:00.000Z" });
  it("keeps exact entered values", () => {
    const r = parseForm({ ...base, cleanBpm: "85", startBpm: "70", rating: "3", notes: " ok " });
    expect(r).toMatchObject({ ok: true, input: { durationMs: 65000, finalBpm: 90, cleanBpm: 85, startBpm: 70, rating: 3, notes: "ok" } });
  });
  it("rejects BPM outside 20–300", () => {
    expect(parseForm({ ...base, finalBpm: "301" }).ok).toBe(false);
    expect(parseForm({ ...base, cleanBpm: "19" }).ok).toBe(false);
  });
  it("requires final BPM and at least 5 seconds", () => {
    expect(parseForm({ ...base, finalBpm: "" }).ok).toBe(false);
    expect(parseForm({ ...base, minutes: "0", seconds: "4" }).ok).toBe(false);
  });
  it("rejects future dates", () => {
    expect(parseForm({ ...base, startedAt: "2099-01-01T10:00" }).ok).toBe(false);
  });
});

describe("export / import", () => {
  it("escapes CSV cells and neutralises formulas", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(toCsv([s({ notes: "linha1\nlinha2" })], () => "Flam").split("\r\n")[1]).toContain('"linha1\nlinha2"');
  });
  it("JSON backup round-trips", () => {
    const list = [s({ cleanBpm: 88 })];
    const r = parseBackup(JSON.stringify(toBackup(list)), new Set(["flam"]));
    expect(r).toEqual({ ok: true, sessions: list });
  });
  it("rejects backups with unknown rudiments or wrong shape", () => {
    expect(parseBackup(JSON.stringify(toBackup([s({ rudimentId: "nope" })])), new Set(["flam"])).ok).toBe(false);
    expect(parseBackup('{"app":"x"}', new Set(["flam"])).ok).toBe(false);
  });
  it("import never overwrites existing records", () => {
    const plan = planImport([s({ id: "a" }), s({ id: "b" })], [s({ id: "a" }), s({ id: "b", finalBpm: 99 }), s({ id: "c" })]);
    expect(plan.toAdd.map((x) => x.id)).toEqual(["c"]);
    expect(plan).toMatchObject({ duplicates: 1, conflicts: 1 });
  });
});
