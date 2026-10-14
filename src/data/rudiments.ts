/**
 * Single source of truth for the PAS 40 Essential Rudiments.
 * Families follow the official PAS grouping:
 *  - rolls: #1–15 (Roll Rudiments)
 *  - diddles: #16–19 (Diddle Rudiments / Paradiddles)
 *  - flams: #20–30 (Flam Rudiments)
 *  - drags: #31–40 (Drag Rudiments)
 * Sticking and notation are intentionally null until verified (Phase 2).
 */
export type RudimentFamily = "rolls" | "diddles" | "flams" | "drags";
export type VerificationStatus = "verified" | "pending";

export interface Rudiment {
  id: string;
  order: number;
  name: string;
  family: RudimentFamily;
  referenceUrl: string;
  learningResourceUrl: string;
  sticking: string | null;
  notation: string | null;
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

export const RUDIMENTS: readonly Rudiment[] = NAMES.map((name, i) => ({
  id: slugify(name),
  order: i + 1,
  name,
  family: familyFor(i + 1),
  referenceUrl: PAS_REFERENCE_URL,
  learningResourceUrl: `https://drumrudiments.com/drum-rudiments/drum-lessons/${STUDY_SLUGS[i]}-drum-rudiment.htm`,
  sticking: null,
  notation: null,
  dataStatus: "pending",
}));

export function getRudiment(id: string) {
  return RUDIMENTS.find((r) => r.id === id);
}
