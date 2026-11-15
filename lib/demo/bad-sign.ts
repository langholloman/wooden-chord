import { makeLead, type Song } from "@/lib/demo/song";

/**
 * Concert key of the 1967 record, on standard tuning.
 * The line is an original lesson in the bends, not the vocal melody or the horn figures.
 * A unison partner is the same pitch, fretted on the next string.
 */
const lead = makeLead(1);

const Csharp7 = {
  name: "C#7",
  numeral: "I7",
  tones: [1, 5, 8, 11],
  frets: [null, 4, 3, 1, 0, 4],
  lesson: "Home. C#, F, G#, and B. F is the major 3rd. When the line sits on E, that E is the sharp nine against this F.",
};

const Fsharp7 = {
  name: "F#7",
  numeral: "IV7",
  tones: [6, 10, 1, 4],
  frets: [2, 4, 2, 3, 2, 0],
  lesson: "The IV chord. A#, the sweet note of C#, is the major 3rd here, so the line can sit on it.",
};

const A7 = {
  name: "A7",
  numeral: "♭VI7",
  tones: [9, 1, 4, 7],
  frets: [0, 0, 2, 0, 2, 0],
  lesson: "The flat VI. Its flat 7 is G, the blue note of the key, so the open G string agrees with the chord.",
};

const Gsharp7 = {
  name: "G#7",
  numeral: "V7",
  tones: [8, 0, 3, 6],
  frets: [2, 3, 4, 1, 4, 2],
  lesson: "The dominant. G# is home for this bar. The blue note G sits a half step under it.",
};

const line = [
  lead(0, 0, 4 / 3, 5, 4, "The 5th, sung and held across the shuffle."),
  lead(0, 4 / 3, 2 / 3, 4, 2, "The root answers it. Then the bar is empty."),
  lead(1, 0, 2 / 3, 3, 4, "The flat 7 on the G string. This fret is about to bend."),
  lead(1, 2 / 3, 2 / 3, 4, 5, "Down to the minor 3rd."),
  lead(1, 4 / 3, 4 / 3, 5, 0, "The same E, open, so the finger can leave."),
  lead(2, 0, 4 / 3, 5, 4, "The first cell again. He repeats before he develops."),
  lead(2, 4 / 3, 2 / 3, 4, 2, "The root, and then air."),
  lead(3, 0, 2 / 3, 3, 4, "The flat 7 again. This time it does not change frets."),
  lead(
    3,
    2 / 3,
    2,
    3,
    4,
    "Whole-step bend until it matches the root on the B string. The finger stays on fret 4.",
    2,
    { string: 4, fret: 2 },
  ),
  lead(3, 8 / 3, 4 / 3, 1, 4, "A fretted root confirms the bend."),
  lead(4, 0, 2, 3, 3, "The sweet note. Outside C#7. On F#7 it is the major 3rd, so he sits on it."),
  lead(4, 2, 4 / 3, 5, 2, "The IV's root, on the high string."),
  lead(4, 10 / 3, 2 / 3, 5, 0, "Open E, the flat 7 of F#7."),
  lead(5, 0, 2 / 3, 4, 5, "Launch fret. This E is the flat 7 of F#7 before it moves."),
  lead(
    5,
    2 / 3,
    5 / 3,
    4,
    5,
    "Minor-third bend until it matches the G on the high string. That match is the unison. G is not in F#7, so it rubs.",
    3,
    { string: 5, fret: 3 },
  ),
  lead(5, 7 / 3, 5 / 3, 3, 3, "Leave the bend by changing notes. Land on the 3rd of F#7."),
  lead(6, 0, 2 / 3, 4, 5, "Home chord. The minor 3rd, which is also the sharp nine against the F in C#7."),
  lead(6, 2 / 3, 1, 4, 5, "A one-semitone curl to the chord's major 3rd.", 1),
  lead(6, 5 / 3, 2 / 3, 4, 5, "The curl comes back to the minor 3rd."),
  lead(6, 7 / 3, 5 / 3, 4, 2, "The root."),
  lead(7, 0, 2, 1, 4, "One low root. The rest of the bar is the band."),
  lead(8, 0, 2, 3, 0, "The blue note, open. It is the flat 7 of A7, so the chord agrees with it."),
  lead(8, 2, 2, 5, 0, "Open E, the 5th of A7 and the flat 3 of the key."),
  lead(9, 0, 2 / 3, 5, 2, "The flat 7 of G#7, fretted before it moves."),
  lead(9, 2 / 3, 5 / 3, 5, 2, "Whole-step bend to the V chord's root.", 2),
  lead(9, 7 / 3, 5 / 3, 3, 1, "G#, an octave lower, on the G string. The squeeze can stop."),
  lead(10, 0, 2 / 3, 3, 3, "The sweet note, outside the home chord again. It is the launch."),
  lead(
    10,
    2 / 3,
    2,
    3,
    3,
    "Minor-third bend from the 6th to the root. It meets the root fretted on the B string.",
    3,
    { string: 4, fret: 2 },
  ),
  lead(10, 8 / 3, 4 / 3, 4, 2, "The same root, plucked. The bend ends by changing strings."),
  lead(
    11,
    0,
    1,
    4,
    5,
    "The unison bend once more, up to the G on the high string. G against G#7 is the rub. Short.",
    3,
    { string: 5, fret: 3 },
  ),
  lead(11, 1, 1, 3, 1, "Resolve to the V chord's root."),
  lead(11, 2, 2, 1, 4, "The key's root held across the V, so the next chorus can enter on the high 5th."),
];

export const badSign: Song = {
  id: "bad-sign",
  title: "Born Under a Bad Sign",
  player: "Albert King",
  lede: "Born Under a Bad Sign, in C♯, as a lesson. The lead stays inside the first five frets and reaches the melody by bending. Original line for study, not the recording.",
  scaleTitle: "C♯ blues",
  spelling: "sharp",
  root: 1,
  bpm: 92,
  feel: "shuffle",
  beatsPerBar: 4,
  windowStart: 0,
  windowEnd: 5,
  leadKicker: "Albert King",
  leadTitle: "C♯ blues",
  leadSubtitle: "The scale in this position",
  form: [Csharp7, Csharp7, Csharp7, Csharp7, Fsharp7, Fsharp7, Csharp7, Csharp7, A7, Gsharp7, Csharp7, Gsharp7],
  lead: line,
};
