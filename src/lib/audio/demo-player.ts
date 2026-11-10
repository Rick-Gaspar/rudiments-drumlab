import type { NotationData } from "@/data/rudiments";
import { CuttableBus, LookaheadScheduler, ensureAudio, scheduleStroke } from "./audio-context";
import { clampBpm, type PlayState } from "./metronome";

export interface DemoSnapshot {
  state: PlayState;
  bpm: number;
  /** Index of the event currently sounding, -1 when idle. */
  index: number;
  error: string | null;
}

const FLAM_OFFSET = 0.03;
const DRAG_GAP = 0.035;

let active: DemoPlayer | null = null;

/** Plays a rudiment's verified rhythmic events with synthesized strokes, looping. */
export class DemoPlayer {
  private snap: DemoSnapshot;
  private listeners = new Set<() => void>();
  private bus: CuttableBus | null = null;
  private sched: LookaheadScheduler | null = null;
  private nextTime = 0;
  private i = 0;
  private queue: { time: number; index: number }[] = [];
  private raf = 0;

  constructor(private pattern: NotationData, bpm: number) {
    this.snap = { state: "stopped", bpm: clampBpm(bpm), index: -1, error: null };
  }

  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };
  getSnapshot = () => this.snap;
  private set(p: Partial<DemoSnapshot>) {
    this.snap = { ...this.snap, ...p };
    this.listeners.forEach((l) => l());
  }

  setBpm(bpm: number) {
    this.set({ bpm: clampBpm(bpm) });
  }

  async play(fromStart = false) {
    if (this.snap.state === "running" && !fromStart) return;
    let c: AudioContext;
    try {
      c = await ensureAudio();
    } catch (e) {
      this.set({ error: e instanceof Error ? e.message : "Áudio indisponível." });
      return;
    }
    if (active && active !== this) active.stop();
    active = this;
    this.halt();
    if (fromStart || this.snap.state === "stopped") this.i = 0;
    this.bus ??= new CuttableBus(c, 0.9);
    this.nextTime = c.currentTime + 0.06;
    this.sched = new LookaheadScheduler(c, (until) => this.fill(c, until));
    this.sched.start();
    this.set({ state: "running", error: null });
    const step = () => {
      let last;
      while (this.queue.length && this.queue[0]!.time <= c.currentTime) last = this.queue.shift();
      if (last) this.set({ index: last.index });
      if (this.snap.state === "running") this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  private fill(c: AudioContext, until: number) {
    const evs = this.pattern.events;
    const quarter = 60 / this.snap.bpm;
    while (this.nextTime < until) {
      const idx = this.i % evs.length;
      const e = evs[idx]!;
      const pan = e.hand === "R" ? 0.25 : -0.25;
      const at = (t: number) => Math.max(c.currentTime, t);
      if (e.flamGrace) scheduleStroke(c, this.bus!.node, at(this.nextTime - FLAM_OFFSET), 0.3, -pan);
      if (e.drag) {
        const gp = e.drag === "R" ? 0.25 : -0.25;
        scheduleStroke(c, this.bus!.node, at(this.nextTime - 2 * DRAG_GAP), 0.28, gp);
        scheduleStroke(c, this.bus!.node, at(this.nextTime - DRAG_GAP), 0.28, gp);
      }
      const dur = e.beats * quarter;
      if (e.buzz) {
        // Multiple-bounce: a quick decaying series of soft strokes across the note.
        const n = Math.max(3, Math.round(dur / 0.03));
        for (let k = 0; k < n; k++) scheduleStroke(c, this.bus!.node, this.nextTime + (k * dur) / n, (e.accent ? 0.8 : 0.45) * (1 - k / (n * 1.5)), pan);
      } else {
        scheduleStroke(c, this.bus!.node, this.nextTime, e.accent ? 1 : 0.55, pan);
      }
      this.queue.push({ time: this.nextTime, index: idx });
      this.nextTime += e.beats * quarter;
      this.i++;
    }
  }

  private halt() {
    this.sched?.stop();
    this.sched = null;
    this.bus?.cut();
    this.queue = [];
    cancelAnimationFrame(this.raf);
  }

  pause() {
    if (this.snap.state !== "running") return;
    this.halt();
    this.set({ state: "paused" });
  }

  stop() {
    this.halt();
    this.i = 0;
    if (active === this) active = null;
    this.set({ state: "stopped", index: -1 });
  }

  dispose() {
    this.stop();
    this.listeners.clear();
  }
}
