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
  /** VexFlow duration code ("8" | "16"). */
  duration: "8" | "16";
  beats: number;
  accent?: boolean;
  /** Grace-note hand for flams (played just before the main stroke). */
  flamGrace?: Hand;
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

function ev(seq: string, duration: "8" | "16"): RhythmicEvent[] {
  // seq tokens: "R", "L", ">R" (accent), "lR" (flam with left grace), ">lR"
  const beats = duration === "16" ? 0.25 : 0.5;
  return seq.split(" ").map((t) => {
    const accent = t.startsWith(">");
    const core = accent ? t.slice(1) : t;
    const hand = core[core.length - 1] as Hand;
    const grace = core.length === 2 ? (core[0].toUpperCase() as Hand) : undefined;
    return { hand, duration, beats, ...(accent ? { accent } : {}), ...(grace ? { flamGrace: grace } : {}) };
  });
}

/** Verified patterns only. Rudiments absent here stay "pending". */
const VERIFIED: Record<string, Omit<NotationData, "source">> = {
  "single-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R L R L R L R L", "16") },
  "double-stroke-roll": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev("R R L L R R L L", "16") },
  "single-paradiddle": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev(">R L R R >L R L L", "16") },
  "triple-paradiddle": { timeSignature: "4/4", measures: 1, beamGroup: 4, events: ev(">R L R L R L R R >L R L R L R L L", "16") },
  flam: { timeSignature: "2/4", measures: 1, beamGroup: 2, events: ev("lR rL lR rL", "8") },
  "flam-accent": { timeSignature: "6/8", measures: 1, beamGroup: 3, events: ev(">lR L R >rL R L", "8") },
  "flam-tap": { timeSignature: "2/4", measures: 1, beamGroup: 4, events: ev(">lR R >rL L >lR R >rL L", "16") },
  "flam-paradiddle": { timeSignature: "4/4", measures: 1, beamGroup: 4, events: ev(">lR L R R >rL R L L >lR L R R >rL R L L", "16") },
};

export function stickingOf(n: NotationData) {
  return n.events.map((e) => (e.flamGrace ? e.flamGrace.toLowerCase() : "") + e.hand).join(" ");
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
  const notation: NotationData | null = v ? { ...v, source: PAS_SHEET } : null;
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
