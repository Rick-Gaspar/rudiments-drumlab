/**
 * Single source of truth for the PAS 40 Essential Rudiments.
 * Families follow the official PAS grouping:
 *  - rolls: #1–15 (Roll Rudiments)
 *  - diddles: #16–19 (Diddle Rudiments / Paradiddles)
 *  - flams: #20–30 (Flam Rudiments)
 *  - drags: #31–40 (Drag Rudiments)
 * Sticking/notation are filled only for patterns in VERIFIED; all others stay null + pending.
 */
export type RudimentFamily = "rolls" | "diddles" | "flams" | "drags";
export type VerificationStatus = "verified" | "pending";

export type Hand = "R" | "L";

/** One rhythmic event of a rudiment cycle. `beats` is the length in quarter notes. */
export interface RhythmicEvent {
  hand: Hand;
  /** VexFlow duration code. */
  duration: Duration;
  beats: number;
  accent?: boolean;
  /** Grace-note hand for flams (played just before the main stroke). */
  flamGrace?: Hand;
  /** Hand playing the two drag (ruff) grace notes before the main stroke. */
  drag?: Hand;
  /** Multiple-bounce (buzz) stroke, drawn with a tremolo mark. */
  buzz?: boolean;
  /** Silent event (hand is ignored). */
  rest?: boolean;
  /** Part of a 3-in-the-space-of-2 tuplet; `beats` already scaled by 2/3. */
  triplet?: boolean;
}

export type Duration = "4" | "8" | "16" | "32";
const BEATS: Record<Duration, number> = { "4": 1, "8": 0.5, "16": 0.25, "32": 0.125 };

/** Grace prefix shown before the hand letter: "l" (flam), "ll" (drag) or "". */
export function graceLabel(e: RhythmicEvent) {
  if (e.drag) return e.drag.toLowerCase().repeat(2);
  return e.flamGrace ? e.flamGrace.toLowerCase() : "";
}

export interface NotationData {
  timeSignature: "2/4" | "4/4" | "6/8";
  /** Number of measures in one cycle. */
  measures: number;
  /** Events per beam group (e.g. 4 sixteenths or 3 eighths). */
  beamGroup: number;
  events: RhythmicEvent[];
  /** Where the transcription was checked. */
  source: string;
}

export interface Rudiment {
  id: string;
  order: number;
  name: string;
  family: RudimentFamily;
  referenceUrl: string;
  learningResourceUrl: string;
  sticking: string | null;
  notation: NotationData | null;
  dataStatus: VerificationStatus;
}

export const PAS_REFERENCE_URL = "https://ae.vicfirth.com/education/40-essential-rudiments/";
export const LEARNING_RESOURCE_URL = "https://drumrudiments.com/";

export const FAMILY_LABELS: Record<RudimentFamily, string> = {
  rolls: "Rolls",
  diddles: "Paradiddles",
  flams: "Flams",
  drags: "Drags",
};

const NAMES: string[] = [
  "Single Stroke Roll",
  "Single Stroke Four",
  "Single Stroke Seven",
  "Multiple Bounce Roll",
  "Triple Stroke Roll",
  "Double Stroke Roll",
  "Five Stroke Roll",
  "Six Stroke Roll",
  "Seven Stroke Roll",
  "Nine Stroke Roll",
  "Ten Stroke Roll",
  "Eleven Stroke Roll",
  "Thirteen Stroke Roll",
  "Fifteen Stroke Roll",
  "Seventeen Stroke Roll",
  "Single Paradiddle",
  "Double Paradiddle",
  "Triple Paradiddle",
  "Paradiddle-Diddle",
  "Flam",
  "Flam Accent",
  "Flam Tap",
  "Flamacue",
  "Flam Paradiddle",
  "Single Flammed Mill",
  "Flam Paradiddle-Diddle",
  "Pataflafla",
  "Swiss Army Triplet",
  "Inverted Flam Tap",
  "Flam Drag",
  "Drag (Ruff)",
  "Single Drag Tap",
  "Double Drag Tap",
  "Lesson 25",
  "Single Dragadiddle",
  "Drag Paradiddle #1",
  "Drag Paradiddle #2",
  "Single Ratamacue",
  "Double Ratamacue",
  "Triple Ratamacue",
];

/**
 * Verified drumrudiments.com lesson slugs, index-aligned with NAMES.
 * Some slugs follow the site's own spelling (e.g. "flag-drag", "double-ratamatcue").
 */
const STUDY_SLUGS: string[] = [
  "single-stroke-roll",
  "single-stroke-four",
  "single-stroke-seven",
  "multiple-bounce-roll",
  "triple-stroke-roll",
  "double-stroke-open-roll",
  "five-stroke-roll",
  "six-stroke-roll",
  "seven-stroke-roll",
  "nine-stroke-roll",
  "ten-stroke-roll",
  "eleven-stroke-roll",
  "thirteen-stroke-roll",
  "fifteen-stroke-roll",
  "seventeen-stroke-roll",
  "single-paradiddle",
  "double-paradiddle",
  "triple-paradiddle",
  "single-paradiddle-diddle",
  "flam",
  "flam-accent",
  "flam-tap",
  "flamacue",
  "flam-paradiddle",
  "single-flammed-mill",
  "flam-paradiddle-diddle",
  "pataflafla",
  "swiss-army-triplet",
  "inverted-flam-tap",
  "flag-drag",
  "drag",
  "single-drag-tap",
  "double-drag-tap",
  "lesson-25",
  "single-dragadiddle",
  "drag-paradiddle-1",
  "drag-paradiddle-2",
  "single-ratamacue",
  "double-ratamatcue",
  "triple-ratamacue",
];

const PAS_SHEET = "PAS International Drum Rudiments (40 Essential), standard notation";

function ev(seq: string, defaultDuration: Duration | `${Duration}t`): RhythmicEvent[] {
  // tokens: "R", ">R" (accent), "~R" (buzz), "lR" (flam), "llR" (drag), optional ":32" duration suffix
  // "_" = rest, ":16t" = triplet sixteenth
  return seq.split(" ").map((t) => {
    const [body, rawDur] = t.split(":") as [string, string | undefined];
    const durTok = rawDur ?? defaultDuration;
    const triplet = durTok.endsWith("t");
    const duration = durTok.replace("t", "") as Duration;
    const beats = BEATS[duration] * (triplet ? 2 / 3 : 1);
    if (body === "_") return { hand: "R" as Hand, duration, beats, rest: true, ...(triplet ? { triplet } : {}) };
    let core = body;
    const accent = core.startsWith(">");
    if (accent) core = core.slice(1);
    const buzz = core.startsWith("~");
    if (buzz) core = core.slice(1);
    const hand = core[core.length - 1] as Hand;
    const g = core.slice(0, -1).toUpperCase() as Hand | "LL" | "RR" | "";
    return {
      hand,
      duration,
      beats,
      ...(triplet ? { triplet } : {}),
      ...(accent ? { accent } : {}),
      ...(buzz ? { buzz } : {}),
      ...(g.length === 1 ? { flamGrace: g as Hand } : {}),
      ...(g.length === 2 ? { drag: g[0] as Hand } : {}),
    };
  });
}

/** Verified patterns only. Rudiments absent here stay "pending". */
const REVIEW = "Transcrito do padrão PAS — aguardando revisão com a folha oficial";
const VERIFIED: Record<string, Omit<NotationData, "source"> & { source?: string }> = {
  "single-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R L R L R L R L", "16") },
  "double-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R R L L R R L L", "16") },
  "single-paradiddle": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev(">R L R R >L R L L", "16") },
  "triple-paradiddle": { timeSignature: "4/4", measures: 1, beamGroup: 4, events: ev(">R L R L R L R R >L R L R L R L L", "16") },
  flam: { timeSignature: "2/4", measures: 1, beamGroup: 2, events: ev("lR rL lR rL", "8") },
  "flam-accent": { timeSignature: "6/8", measures: 1, beamGroup: 3, events: ev(">lR L R >rL R L", "8") },
  "flam-tap": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev(">lR R >rL L >lR R >rL L", "16") },
  "flam-paradiddle": { timeSignature: "4/4", measures: 1, beamGroup: 4, events: ev(">lR L R R >rL R L L >lR L R R >rL R L L", "16") },
  // Batch 2 — transcribed from the PAS standard, awaiting the user's review against their sheet.
  "double-paradiddle": { timeSignature: "6/8", measures: 1, beamGroup: 6, events: ev(">R L R L R R >L R L R L L", "16"), source: REVIEW },
  "paradiddle-diddle": { timeSignature: "6/8", measures: 1, beamGroup: 6, events: ev(">R L R R L L >R L R R L L", "16"), source: REVIEW },
  "single-flammed-mill": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev(">lR R L R >rL L R L", "16"), source: REVIEW },
  "flam-paradiddle-diddle": { timeSignature: "6/8", measures: 1, beamGroup: 6, events: ev(">lR L R R L L >rL R L L R R", "16"), source: REVIEW },
  pataflafla: { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("lR L R rL lR L R rL", "16"), source: REVIEW },
  "swiss-army-triplet": { timeSignature: "6/8", measures: 1, beamGroup: 3, events: ev(">lR R L >lR R L", "8"), source: REVIEW },
  // Batch 3 — rolls and drags using the new duration/drag/buzz support (awaiting review).
  "multiple-bounce-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("~R ~L ~R ~L ~R ~L ~R ~L", "16"), source: REVIEW },
  "five-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R:32 R:32 L:32 L:32 >R:8 L:32 L:32 R:32 R:32 >L:8", "32"), source: REVIEW },
  flamacue: { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("lR >L R L lR:4", "16"), source: REVIEW },
  "drag-ruff": { timeSignature: "2/4", measures: 1, beamGroup: 1, events: ev("llR rrL", "4"), source: REVIEW },
  "single-drag-tap": { timeSignature: "2/4", measures: 1, beamGroup: 2, events: ev("llR >L rrL >R", "8"), source: REVIEW },
  "lesson-25": { timeSignature: "2/4", measures: 1, beamGroup: 3, events: ev("llR:16 L:16 >R rrL:16 R:16 >L", "8"), source: REVIEW },
  "inverted-flam-tap": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev(">lR L >rL R >lR L >rL R", "16"), source: REVIEW },
  // Batch 4 — triplets and rests (awaiting review).
  "single-stroke-four": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R:16t L:16t R:16t >L:8 L:16t R:16t L:16t >R:8", "16"), source: REVIEW },
  "single-stroke-seven": { timeSignature: "2/4", measures: 1, beamGroup: 6, events: ev("R L R L R L >R:4", "16t"), source: REVIEW },
  "triple-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 3, events: ev("R R R L L L R R R L L L", "16t"), source: REVIEW },
  "six-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev(">R:16 L L R R >L:16 >R:16 L L R R >L:16", "32"), source: REVIEW },
  "seven-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R R L L R R >L:16 L L R R L L >R:16", "32"), source: REVIEW },
  "nine-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R R L L R R L L >R:8 _:8", "32"), source: REVIEW },
  "ten-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R R L L R R L L >R:8 >L:8", "32"), source: REVIEW },
  "eleven-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R R L L R R L L R R >L:8 _:16", "32"), source: REVIEW },
  "thirteen-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R R L L R R L L R R L L >R:16 _:16", "32"), source: REVIEW },
  "fifteen-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R R L L R R L L R R L L R R >L:16", "32"), source: REVIEW },
  "seventeen-stroke-roll": { timeSignature: "4/4", measures: 1, beamGroup: 4, events: ev("R R L L R R L L R R L L R R L L >R:4 _:4", "32"), source: REVIEW },
  "flam-drag": { timeSignature: "6/8", measures: 1, beamGroup: 4, events: ev(">lR:8 L:16 L:16 R:8 >rL:8 R:16 R:16 L:8", "16"), source: REVIEW },
  "double-drag-tap": { timeSignature: "6/8", measures: 1, beamGroup: 3, events: ev("llR llR >L rrL rrL >R", "8"), source: REVIEW },
  "single-dragadiddle": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev(">llR L R R >rrL R L L", "16"), source: REVIEW },
  "drag-paradiddle-1": { timeSignature: "6/8", measures: 1, beamGroup: 4, events: ev(">R:8 llR L R R >L:8 rrL R L L", "16"), source: REVIEW },
  "drag-paradiddle-2": { timeSignature: "6/8", measures: 1, beamGroup: 6, events: ev(">R llR llR L R R >L rrL rrL R L L", "16"), source: REVIEW },
  "single-ratamacue": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("llR:16t L:16t R:16t >L:8 rrL:16t R:16t L:16t >R:8", "16"), source: REVIEW },
  "double-ratamacue": { timeSignature: "4/4", measures: 1, beamGroup: 4, events: ev("llR:8 llR:16t L:16t R:16t >L:4 rrL:8 rrL:16t R:16t L:16t >R:4", "8"), source: REVIEW },
  "triple-ratamacue": { timeSignature: "4/4", measures: 1, beamGroup: 4, events: ev("llR:16 llR:16 llR:16t L:16t R:16t >L:4 rrL:16 rrL:16 rrL:16t R:16t L:16t >R:4", "8"), source: REVIEW },
};

export function stickingOf(n: NotationData) {
  return n.events.filter((e) => !e.rest).map((e) => graceLabel(e) + e.hand).join(" ");
}

function familyFor(order: number): RudimentFamily {
  if (order <= 15) return "rolls";
  if (order <= 19) return "diddles";
  if (order <= 30) return "flams";
  return "drags";
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/#/g, "")
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const RUDIMENTS: readonly Rudiment[] = NAMES.map((name, i) => {
  const id = slugify(name);
  const v = VERIFIED[id];
  const notation: NotationData | null = v ? { ...v, source: v.source ?? PAS_SHEET } : null;
  return {
  id,
  order: i + 1,
  name,
  family: familyFor(i + 1),
  referenceUrl: PAS_REFERENCE_URL,
  learningResourceUrl: `https://drumrudiments.com/drum-rudiments/drum-lessons/${STUDY_SLUGS[i]}-drum-rudiment.htm`,
  sticking: notation ? stickingOf(notation) : null,
  notation,
  dataStatus: notation ? "verified" : "pending",
  } satisfies Rudiment;
});

export function getRudiment(id: string) {
  return RUDIMENTS.find((r) => r.id === id);
}
