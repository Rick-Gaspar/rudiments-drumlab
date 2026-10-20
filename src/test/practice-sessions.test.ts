import { describe, expect, it } from "vitest";
import { applySession, totalMs, type PracticeSession } from "@/lib/practice-store";

const s = (o: Partial<PracticeSession>): PracticeSession => ({ id: "x", rudimentId: "flam", endedAt: "2026-10-16T00:00:00Z", durationMs: 60000, bpm: 60, ...o });

describe("practice sessions", () => {
  it("moves a not-started rudiment to learning", () => {
    expect(applySession({}, s({}))["flam"]!.status).toBe("learning");
  });
  it("keeps practiced status", () => {
    const p = { flam: { status: "practiced" as const, personalBestBpm: 90, lastPracticedAt: null } };
    expect(applySession(p, s({ bpm: 70 })).flam).toMatchObject({ status: "practiced", personalBestBpm: 90 });
  });
  it("raises best BPM", () => {
    expect(applySession({}, s({ bpm: 80 }))["flam"]!.personalBestBpm).toBe(80);
  });
  it("sums time per rudiment", () => {
    expect(totalMs([s({}), s({ rudimentId: "flam-tap" }), s({ durationMs: 30000 })], "flam")).toBe(90000);
  });
});
