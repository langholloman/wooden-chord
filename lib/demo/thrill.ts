import { noteName } from "@/lib/theory";

/** B.B. King's 1969 key. The line below is an original lesson, not his recording. */
export const ROOT = 11;
/** Slow straight eighths, in the pocket of the record. */
export const BPM = 80;
export const BEATS_PER_BAR = 4;
export const BAR_COUNT = 12;

const OPEN_MIDI = [40, 45, 50, 55, 59, 64] as const;
const OPEN_PITCH = [4, 9, 2, 7, 11, 4] as const;

/** B minor blues: root, ♭3, 4, ♭5, 5, ♭7. */
export const BLUES_INTERVALS = [0, 3, 5, 6, 7, 10] as const;
export const BLUE_NOTE = (ROOT + 6) % 12;

export const BLUES_PITCHES = new Set(BLUES_INTERVALS.map((interval) => (ROOT + interval) % 12));

export type Grip = ReadonlyArray<number | null>;

export type BarChord = {
  name: string;
  numeral: string;
  tones: readonly number[];
  frets: Grip;
  lesson: string;
};

export type LeadNote = {
  bar: number;
  beat: number;
  duration: number;
  string: number;
  fret: number;
  outside: boolean;
  blue: boolean;
  lesson: string;
};

const Bm7: BarChord = {
  name: "Bm7",
  numeral: "i7",
  tones: [11, 2, 6, 9],
  frets: [7, 9, 7, 7, 7, 7],
  lesson: "Home. Root, minor 3rd, 5th, and minor 7th. The blues box is built on this chord.",
};

const Em7: BarChord = {
  name: "Em7",
  numeral: "iv7",
  tones: [4, 7, 11, 2],
  frets: [null, 7, 9, 7, 8, 7],
  lesson: "The iv chord. B, D, and E from the box sit in it. G, its minor 3rd, lives outside the pentatonic.",
};

const Gmaj7: BarChord = {
  name: "Gmaj7",
  numeral: "♭VImaj7",
  tones: [7, 11, 2, 6],
  frets: [null, 10, 9, 7, 7, null],
  lesson: "The move that marks this song. B, D, and F# agree with the box. G, the chord's root, steps outside it.",
};

const Fsharp7: BarChord = {
  name: "F#7",
  numeral: "V7",
  tones: [6, 10, 1, 4],
  frets: [null, 9, 8, 9, 7, 9],
  lesson: "The dominant that pulls home. F# and E agree with the box. A# is the leading tone, and it is not in the blues scale.",
};

/** Twelve bars. King's version moves Gmaj7 down to F#7 before returning to Bm7. */
export const FORM: readonly BarChord[] = [
  Bm7,
  Bm7,
  Bm7,
  Bm7,
  Em7,
  Em7,
  Bm7,
  Bm7,
  Gmaj7,
  Fsharp7,
  Bm7,
  Bm7,
];

function lead(
  bar: number,
  beat: number,
  duration: number,
  string: number,
  fret: number,
  lesson: string,
): LeadNote {
  const pitch = (OPEN_PITCH[string] + fret) % 12;
  return {
    bar,
    beat,
    duration,
    string,
    fret,
    outside: !BLUES_PITCHES.has(pitch),
    blue: pitch === BLUE_NOTE,
    lesson,
  };
}

/**
 * An original line in the 7th-fret box. Strong beats land on a chord tone.
 * Two notes step outside the blues scale on purpose: G over Gmaj7, A# over F#7.
 */
export const LEAD: readonly LeadNote[] = [
  lead(0, 0, 2, 2, 9, "B, the root, on the 4th string."),
  lead(0, 2, 2, 3, 7, "D, the minor 3rd of Bm7."),
  lead(1, 0, 2, 1, 9, "F#, the 5th, on the 5th string."),
  lead(1, 2, 2, 2, 7, "A, the minor 7th."),
  lead(2, 0, 1.5, 4, 10, "A again, up on the 2nd string."),
  lead(2, 1.5, 1.5, 4, 7, "F# under it."),
  lead(2, 3, 1, 5, 7, "B on the high string."),
  lead(3, 0, 2, 5, 10, "D, still inside Bm7."),
  lead(3, 2, 2, 4, 12, "B at the 12th fret, ready for the iv chord."),
  lead(4, 0, 2, 3, 9, "E, the root of Em7, and a scale tone."),
  lead(4, 2, 2, 3, 7, "D, the minor 7th of Em7."),
  lead(5, 0, 2, 2, 9, "B, shared by Em7 and the home chord."),
  lead(5, 2, 2, 1, 7, "E, back down on the 5th string."),
  lead(6, 0, 2, 0, 7, "Low B. Home again."),
  lead(6, 2, 2, 0, 10, "D, the minor 3rd, on the low string."),
  lead(7, 0, 2, 1, 8, "F, the blue note between 4 and 5. Color, not a chord tone."),
  lead(7, 2, 2, 1, 9, "F# resolves the blue note to the 5th."),
  lead(8, 0, 2, 4, 8, "G, the root of Gmaj7. It belongs to the chord and sits outside the blues box."),
  lead(8, 2, 2, 5, 7, "B, back inside the box and inside Gmaj7."),
  lead(9, 0, 1.5, 1, 9, "F#, the root of the dominant."),
  lead(9, 2, 1, 2, 8, "A#, the leading tone. Outside the blues scale, and the reason F#7 pulls back to B."),
  lead(9, 3, 1, 3, 9, "E, the ♭7 of F#7, which is back in the scale."),
  lead(10, 0, 2, 5, 7, "B on the high string. Home."),
  lead(10, 2, 2, 4, 10, "A, the minor 7th."),
  lead(11, 0, 2, 1, 8, "The blue note once more, then it settles."),
  lead(11, 2, 2, 0, 7, "Low B closes the chorus."),
];

export function beatSeconds(): number {
  return 60 / BPM;
}

export function barSeconds(): number {
  return beatSeconds() * BEATS_PER_BAR;
}

export function chorusSeconds(): number {
  return barSeconds() * BAR_COUNT;
}

export function pitchClass(string: number, fret: number): number {
  return (OPEN_PITCH[string] + fret) % 12;
}

export function midiNote(string: number, fret: number): number {
  return OPEN_MIDI[string] + fret;
}

export function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export type Playhead = {
  bar: number;
  beat: number;
  noteIndex: number | null;
  strum: boolean;
};

export function placeAt(elapsed: number): Playhead {
  const chorus = chorusSeconds();
  const loop = ((elapsed % chorus) + chorus) % chorus;
  const bar = Math.min(BAR_COUNT - 1, Math.floor(loop / barSeconds()));
  const beat = (loop - bar * barSeconds()) / beatSeconds();
  const noteIndex = LEAD.findIndex(
    (note) => note.bar === bar && beat >= note.beat && beat < note.beat + note.duration,
  );
  const intoBeat = beat - Math.floor(beat);
  const strum = Math.floor(beat) % 2 === 0 && intoBeat < 0.22;
  return { bar, beat, noteIndex: noteIndex === -1 ? null : noteIndex, strum };
}

export function bluesSpelling(): string {
  return BLUES_INTERVALS.map((interval) => noteName((ROOT + interval) % 12, "sharp")).join("  ");
}

export function leadElapsed(note: LeadNote, loop = 0): number {
  return (loop * BAR_COUNT + note.bar) * barSeconds() + note.beat * beatSeconds();
}
