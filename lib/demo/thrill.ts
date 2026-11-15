import { makeLead, type Song } from "@/lib/demo/song";

/** B.B. King's 1969 key. The line below is an original lesson, not his recording. */
const lead = makeLead(11);

const Bm7 = {
  name: "Bm7",
  numeral: "i7",
  tones: [11, 2, 6, 9],
  frets: [7, 9, 7, 7, 7, 7],
  lesson: "Home. Root, minor 3rd, 5th, and minor 7th. The blues box is built on this chord.",
};

const Em7 = {
  name: "Em7",
  numeral: "iv7",
  tones: [4, 7, 11, 2],
  frets: [null, 7, 9, 7, 8, 7],
  lesson: "The iv chord. B, D, and E from the box sit in it. G, its minor 3rd, lives outside the pentatonic.",
};

const Gmaj7 = {
  name: "Gmaj7",
  numeral: "♭VImaj7",
  tones: [7, 11, 2, 6],
  frets: [null, 10, 9, 7, 7, null],
  lesson: "The move that marks this song. B, D, and F# agree with the box. G, the chord's root, steps outside it.",
};

const Fsharp7 = {
  name: "F#7",
  numeral: "V7",
  tones: [6, 10, 1, 4],
  frets: [null, 9, 8, 9, 7, 9],
  lesson: "The dominant that pulls home. F# and E agree with the box. A# is the leading tone, and it is not in the blues scale.",
};

/**
 * An original line in the 7th-fret box. Strong beats land on a chord tone.
 * Two notes step outside the blues scale on purpose: G over Gmaj7, A# over F#7.
 */
const line = [
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

export const thrill: Song = {
  id: "thrill",
  title: "The Thrill Is Gone",
  player: "B.B. King",
  lede: "The Thrill Is Gone, in B minor, as a lesson. The rhythm neck holds the chord of the bar. The lead neck keeps the blues scale, including the notes that step outside it. Original line for study, not the recording.",
  scaleTitle: "B minor blues",
  spelling: "sharp",
  root: 11,
  bpm: 80,
  feel: "straight",
  beatsPerBar: 4,
  windowStart: 7,
  windowEnd: 12,
  leadKicker: "B.B. King",
  leadTitle: "B minor blues",
  leadSubtitle: "The scale in this position",
  form: [Bm7, Bm7, Bm7, Bm7, Em7, Em7, Bm7, Bm7, Gmaj7, Fsharp7, Bm7, Bm7],
  lead: line,
};
