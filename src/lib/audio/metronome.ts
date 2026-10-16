import { CuttableBus, LookaheadScheduler, ensureAudio, scheduleClick, type ClickKind } from "./audio-context";

export const BPM_MIN = 20;
export const BPM_MAX = 300;
export const BPM_DEFAULT = 60;

export type Subdivision = 1 | 2 | 3 | 4;
export type PlayState = "stopped" | "running" | "paused";

export interface MetronomeSettings {
  bpm: number;
  beatsPerMeasure: number;
  subdivision: Subdivision;
  accentFirst: boolean;
  countIn: boolean;
  volume: number;
}

export interface MetronomeSnapshot {
  state: PlayState;
  settings: MetronomeSettings;
  /** Beat currently sounding (0-based), -1 when idle. */
  beat: number;
  countingIn: boolean;
  error: string | null;
}

export function clampBpm(v: number) {
  if (!Number.isFinite(v)) return BPM_DEFAULT;
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(v)));
}

interface Pulse {
  time: number;
  beat: number;
  countIn: boolean;
}

let active: Metronome | null = null;

/** Single active metronome: starting one stops any other. */
export class Metronome {
  private snap: MetronomeSnapshot = {
    state: "stopped",
    settings: { bpm: BPM_DEFAULT, beatsPerMeasure: 4, subdivision: 1, accentFirst: true, countIn: false, volume: 0.8 },
    beat: -1,
    countingIn: false,
    error: null,
  };
  private listeners = new Set<() => void>();
  private bus: CuttableBus | null = null;
  private sched: LookaheadScheduler | null = null;
  private nextTime = 0;
  private pulseIndex = 0; // subdivision pulses since start (excluding count-in)
  private countInLeft = 0;
  private queue: Pulse[] = [];
  private raf = 0;

  subscribe = (cb: () => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };
  getSnapshot = () => this.snap;

  private set(p: Partial<MetronomeSnapshot>) {
    this.snap = { ...this.snap, ...p };
    this.listeners.forEach((l) => l());
  }

  update(s: Partial<MetronomeSettings>) {
    const next = { ...this.snap.settings, ...s };
    next.bpm = clampBpm(next.bpm);
    next.beatsPerMeasure = Math.min(12, Math.max(1, Math.round(next.beatsPerMeasure)));
    next.volume = Math.min(1, Math.max(0, next.volume));
    this.bus?.setVolume(next.volume);
    this.set({ settings: next });
  }

  async start() {
    if (this.snap.state === "running") return;
    let c: AudioContext;
    try {
      c = await ensureAudio();
    } catch (e) {
      this.set({ error: e instanceof Error ? e.message : "Áudio indisponível." });
      return;
    }
    if (active && active !== this) active.stop();
    active = this;
    const fresh = this.snap.state === "stopped";
    if (fresh) {
      this.pulseIndex = 0;
      this.countInLeft = this.snap.settings.countIn ? this.snap.settings.beatsPerMeasure : 0;
    }
    this.bus ??= new CuttableBus(c, this.snap.settings.volume);
    this.nextTime = c.currentTime + 0.06;
    this.sched = new LookaheadScheduler(c, (until) => this.fill(c, until));
    this.sched.start();
    this.set({ state: "running", error: null });
    this.loopVisual(c);
  }

  private fill(c: AudioContext, until: number) {
    const { bpm, subdivision, beatsPerMeasure, accentFirst } = this.snap.settings;
    const beatDur = 60 / bpm;
    while (this.nextTime < until) {
      if (this.countInLeft > 0) {
        const beat = beatsPerMeasure - this.countInLeft;
        scheduleClick(c, this.bus!.node, this.nextTime, "count");
        this.queue.push({ time: this.nextTime, beat, countIn: true });
        this.countInLeft--;
        this.nextTime += beatDur;
        continue;
      }
      const sub = this.pulseIndex % subdivision;
      const beat = Math.floor(this.pulseIndex / subdivision) % beatsPerMeasure;
      const kind: ClickKind = sub !== 0 ? "sub" : beat === 0 && accentFirst ? "accent" : "beat";
      scheduleClick(c, this.bus!.node, this.nextTime, kind);
      if (sub === 0) this.queue.push({ time: this.nextTime, beat, countIn: false });
      this.pulseIndex++;
      this.nextTime += beatDur / subdivision;
    }
  }

  private loopVisual(c: AudioContext) {
    cancelAnimationFrame(this.raf);
    const step = () => {
      const now = c.currentTime;
      let last: Pulse | undefined;
      while (this.queue.length && this.queue[0]!.time <= now) last = this.queue.shift();
      if (last) this.set({ beat: last.beat, countingIn: last.countIn });
      if (this.snap.state === "running") this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
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
    if (active === this) active = null;
    this.set({ state: "stopped", beat: -1, countingIn: false });
  }

  dispose() {
    this.stop();
    this.listeners.clear();
  }
}

/** Tap tempo: average of recent intervals, reset after 2s silence. */
export class TapTempo {
  private taps: number[] = [];
  tap(now = performance.now()): number | null {
    if (this.taps.length && now - this.taps[this.taps.length - 1]! > 2000) this.taps = [];
    this.taps.push(now);
    if (this.taps.length > 6) this.taps.shift();
    if (this.taps.length < 2) return null;
    const iv = (this.taps[this.taps.length - 1]! - this.taps[0]!) / (this.taps.length - 1);
    return clampBpm(60000 / iv);
  }
}
