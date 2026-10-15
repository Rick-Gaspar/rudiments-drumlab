/**
 * Shared Web Audio context + synthesized voices. Created lazily after a user
 * gesture (autoplay policy). All timing uses AudioContext.currentTime.
 */
let ctx: AudioContext | null = null;

export class AudioUnsupportedError extends Error {
  constructor() {
    super("Este navegador não suporta Web Audio.");
  }
}

export function isAudioSupported() {
  return typeof window !== "undefined" && !!(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
}

/** Call from a click/keypress handler. */
export async function ensureAudio(): Promise<AudioContext> {
  if (!isAudioSupported()) throw new AudioUnsupportedError();
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
}

export function currentAudioContext() {
  return ctx;
}

export type ClickKind = "accent" | "beat" | "sub" | "count";

const CLICK_FREQ: Record<ClickKind, number> = { accent: 1760, beat: 1046, sub: 660, count: 1318 };
const CLICK_GAIN: Record<ClickKind, number> = { accent: 1, beat: 0.75, sub: 0.4, count: 0.8 };

/** Short pitched click (metronome). */
export function scheduleClick(c: AudioContext, dest: AudioNode, time: number, kind: ClickKind) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = kind === "sub" ? "triangle" : "square";
  osc.frequency.setValueAtTime(CLICK_FREQ[kind], time);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(CLICK_GAIN[kind] * 0.5, time + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
  osc.connect(g).connect(dest);
  osc.start(time);
  osc.stop(time + 0.05);
}

let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext) {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = Math.floor(c.sampleRate * 0.25);
  noiseBuf = c.createBuffer(1, len, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/** Synthesized snare-like stroke (demonstration). level 0..1. */
export function scheduleStroke(c: AudioContext, dest: AudioNode, time: number, level: number, pan = 0) {
  const out = c.createGain();
  out.gain.value = level;
  let node: AudioNode = out;
  if (c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.value = pan;
    out.connect(p);
    node = p;
  }
  node.connect(dest);

  const src = c.createBufferSource();
  src.buffer = noise(c);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1500;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.0001, time);
  ng.gain.exponentialRampToValueAtTime(0.7, time + 0.002);
  ng.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
  src.connect(hp).connect(ng).connect(out);
  src.start(time);
  src.stop(time + 0.16);

  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(260, time);
  osc.frequency.exponentialRampToValueAtTime(160, time + 0.08);
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, time);
  og.gain.exponentialRampToValueAtTime(0.6, time + 0.002);
  og.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
  osc.connect(og).connect(out);
  osc.start(time);
  osc.stop(time + 0.1);
}

/**
 * Lookahead scheduler: a JS timer only *wakes up* the filler; audio events are
 * placed at exact AudioContext times, so there is no drift.
 */
export class LookaheadScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  constructor(
    private c: AudioContext,
    private fill: (until: number) => void,
    private lookahead = 0.12,
  ) {}
  start() {
    this.stop();
    const tick = () => this.fill(this.c.currentTime + this.lookahead);
    tick();
    this.timer = setInterval(tick, 25);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}

/** Output bus that can be cut instantly, silencing anything already scheduled. */
export class CuttableBus {
  node: GainNode;
  constructor(private c: AudioContext, private volume = 0.8) {
    this.node = this.make();
  }
  private make() {
    const g = this.c.createGain();
    g.gain.value = this.volume;
    g.connect(this.c.destination);
    return g;
  }
  setVolume(v: number) {
    this.volume = v;
    this.node.gain.setTargetAtTime(v, this.c.currentTime, 0.01);
  }
  cut() {
    try {
      this.node.disconnect();
    } catch {
      /* already disconnected */
    }
    this.node = this.make();
  }
}
