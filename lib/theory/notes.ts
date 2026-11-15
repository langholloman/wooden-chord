export const SHARP_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const FLAT_NAMES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

export type Spelling = "sharp" | "flat";

export function normalizePitchClass(pitchClass: number): number {
  return ((pitchClass % 12) + 12) % 12;
}

export function noteName(pitchClass: number, spelling: Spelling): string {
  const names = spelling === "flat" ? FLAT_NAMES : SHARP_NAMES;
  return names[normalizePitchClass(pitchClass)];
}

export function ordinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

/** Guitar string numbers run high to low as the array index runs low to high. */
export function stringNumber(index: number, count: number): number {
  return count - index;
}

export function stringName(index: number, count: number): string {
  return `${ordinal(stringNumber(index, count))} string`;
}

export function fretPlace(fret: number, note: string): string {
  if (fret === 0) return `open ${note}`;
  return `${ordinal(fret)} fret ${note}`;
}
