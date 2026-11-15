import { noteName, type Spelling } from "@/lib/theory";

/** Standard guitar, low E to high E, as pitch classes. */
export const OPEN_PITCH = [4, 9, 2, 7, 11, 4] as const;

/** Root, ♭3, 4, ♭5, 5, ♭7. */
export const BLUES_INTERVALS = [0, 3, 5, 6, 7, 10] as const;

export type Grip = ReadonlyArray<number | null>;

export type BarChord = {
  name: string;
  numeral: string;
  /** Root first, then the other chord tones. */
  tones: readonly number[];
  frets: Grip;
  lesson: string;
};

export type Partner = {
  string: number;
  fret: number;
};

export type LeadNote = {
  bar: number;
  beat: number;
  duration: number;
  string: number;
  fret: number;
  /** Semitones the sounding pitch sits above the fretted pitch. */
  bend: number;
  /** A second string held so a bend can arrive on a pitch the fretboard already has. */
  partner: Partner | null;
  outside: boolean;
  blue: boolean;
  lesson: string;
};

export type SongFeel = "straight" | "shuffle";

export type Song = {
  id: string;
  title: string;
  player: string;
  lede: string;
  scaleTitle: string;
  spelling: Spelling;
  root: number;
  bpm: number;
  feel: SongFeel;
  beatsPerBar: number;
  windowStart: number;
  windowEnd: number;
  leadKicker: string;
  leadTitle: string;
  leadSubtitle: string;
  form: readonly BarChord[];
  lead: readonly LeadNote[];
};

export function pitchClass(string: number, fret: number): number {
  return (OPEN_PITCH[string] + fret) % 12;
}

export function blueNote(root: number): number {
  return (root + 6) % 12;
}

export function bluesPitchList(root: number): number[] {
  return BLUES_INTERVALS.map((interval) => (root + interval) % 12);
}

export function makeLead(root: number) {
  const pitches = new Set(bluesPitchList(root));
  const blue = blueNote(root);
  return function lead(
    bar: number,
    beat: number,
    duration: number,
    string: number,
    fret: number,
    lesson: string,
    bend = 0,
    partner: Partner | null = null,
  ): LeadNote {
    const sounding = (pitchClass(string, fret) + bend) % 12;
    return {
      bar,
      beat,
      duration,
      string,
      fret,
      bend,
      partner,
      outside: !pitches.has(sounding),
      blue: sounding === blue,
      lesson,
    };
  };
}

/** Legend and fretboard dots. Four hues, far enough apart to read on wood and on the panel. */
export const LESSON_DOT = {
  chord: "#ffc53d",
  scale: "#ffffff",
  blue: "#3ec6ff",
  outside: "#ff4f8b",
} as const;

export function bluesSpelling(song: Song): string {
  return bluesPitchList(song.root)
    .map((pitch) => noteName(pitch, song.spelling))
    .join("  ");
}
