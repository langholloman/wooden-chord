import { noteName, type Spelling } from "./notes";

export type ChordQuality = "major" | "minor";

export type ChordRole = "R" | "3" | "5";

export const CHORD_INTERVALS: Record<ChordQuality, readonly number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
};

export const ROLE_COLOR: Record<ChordRole, string> = {
  R: "#e4b15c",
  "3": "#e07a45",
  "5": "#d7d0c2",
};

export const ROLE_NAME: Record<ChordRole, string> = {
  R: "Root",
  "3": "3rd",
  "5": "5th",
};

const INTERVAL_SPOKEN: Record<number, string> = {
  0: "root",
  3: "minor 3rd",
  4: "major 3rd",
  7: "5th",
};

export function chordPitchClasses(root: number, quality: ChordQuality): number[] {
  const tonic = ((root % 12) + 12) % 12;
  return CHORD_INTERVALS[quality].map((interval) => (tonic + interval) % 12);
}

export function chordRole(
  pitchClass: number,
  root: number,
  quality: ChordQuality,
): ChordRole | null {
  const interval = (((pitchClass - root) % 12) + 12) % 12;
  if (interval === 0) return "R";
  if (quality === "major" && interval === 4) return "3";
  if (quality === "minor" && interval === 3) return "3";
  if (interval === 7) return "5";
  return null;
}

export function chordName(root: number, quality: ChordQuality, spelling: Spelling): string {
  return `${noteName(root, spelling)} ${quality}`;
}

export function outsideScaleMessage(
  quality: ChordQuality,
  scaleIntervals: readonly number[],
): string | null {
  const outside = CHORD_INTERVALS[quality].filter(
    (interval) => !scaleIntervals.includes(interval),
  );
  if (outside.length === 0) return null;
  const names = outside.map((interval) => INTERVAL_SPOKEN[interval] ?? `interval ${interval}`);
  return `Not in this scale: ${names.join(", ")}.`;
}
