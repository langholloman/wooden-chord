import { boardMetrics, positionWindow, viewWindow } from "../lib/fretboard/layout";
import {
  BASS_STANDARD,
  GUITAR_STANDARD,
  UKULELE_STANDARD,
  chordPitchClasses,
  voiceChord,
  type ChordQuality,
  type Instrument,
} from "../lib/theory";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function expectFrets(actual: number[], expected: number[], label: string) {
  assert(
    actual.length === expected.length && actual.every((fret, index) => fret === expected[index]),
    `${label}: expected ${expected.join(" ")} but got ${actual.join(" ")}`,
  );
}

function checkInstrument(instrument: Instrument, qualities: ChordQuality[]) {
  for (const quality of qualities) {
    for (let root = 0; root < 12; root += 1) {
      const voicing = voiceChord(instrument, root, quality);
      const tones = new Set(chordPitchClasses(root, quality));
      assert(voicing.frets.length === instrument.openPitchClasses.length, `${instrument.id} string count`);
      voicing.pitchClasses.forEach((pitch, index) => {
        assert(tones.has(pitch), `${instrument.id} ${quality} ${root} string ${index} is not a chord tone`);
        assert(voicing.frets[index] >= 0, `${instrument.id} negative fret`);
      });
      assert(
        voicing.pitchClasses.includes(root),
        `${instrument.id} ${quality} ${root} voicing has no root`,
      );
      const window = viewWindow(voicing.frets);
      const metrics = boardMetrics(window.windowStart, instrument.openPitchClasses.length);
      voicing.frets.forEach((fret) => {
        assert(
          metrics.playableFrets.includes(fret),
          `${instrument.id} ${quality} ${root} fret ${fret} is outside ${metrics.playableFrets.join(",")}`,
        );
      });
    }
  }
}

expectFrets(voiceChord(GUITAR_STANDARD, 7, "major").frets, [3, 2, 0, 0, 0, 3], "G major");
expectFrets(voiceChord(GUITAR_STANDARD, 7, "minor").frets, [3, 5, 5, 3, 3, 3], "G minor");
expectFrets(voiceChord(GUITAR_STANDARD, 4, "major").frets, [0, 2, 2, 1, 0, 0], "E major");
expectFrets(voiceChord(GUITAR_STANDARD, 4, "minor").frets, [0, 2, 2, 0, 0, 0], "E minor");
expectFrets(voiceChord(GUITAR_STANDARD, 5, "major").frets, [1, 3, 3, 2, 1, 1], "F major");

const gMajor = voiceChord(GUITAR_STANDARD, 7, "major");
assert(viewWindow(gMajor.frets).label === "1st fret", "G major starts at the 1st fret");

const bMajor = voiceChord(GUITAR_STANDARD, 11, "major");
assert(bMajor.frets.every((fret) => fret <= 5), `B major stays in first position, got ${bMajor.frets.join(" ")}`);
assert(viewWindow(bMajor.frets).label === "1st fret", "B major starts at the 1st fret");

const dMajor = voiceChord(GUITAR_STANDARD, 2, "major");
assert(dMajor.frets.every((fret) => fret <= 5), `D major stays in first position, got ${dMajor.frets.join(" ")}`);

const gAtThird = voiceChord(GUITAR_STANDARD, 7, "major", 3);
expectFrets(gAtThird.frets, [3, 5, 5, 4, 3, 3], "G major at the 3rd fret");
assert(positionWindow(3).label === "3rd fret", "3rd fret position label");
for (const start of [0, 2, 3, 5, 7, 8, 10, 12]) {
  const voiced = voiceChord(GUITAR_STANDARD, 7, "major", start);
  const low = start === 0 ? 0 : start;
  const high = low + 5;
  assert(
    voiced.frets.every((fret) => fret >= low && fret <= high),
    `G major at ${start} left the window, got ${voiced.frets.join(" ")}`,
  );
}

checkInstrument(GUITAR_STANDARD, ["major", "minor"]);
checkInstrument(BASS_STANDARD, ["major", "minor"]);
checkInstrument(UKULELE_STANDARD, ["major", "minor"]);

const ukeC = voiceChord(UKULELE_STANDARD, 0, "major");
expectFrets(ukeC.frets, [0, 0, 0, 3], "ukulele C major");

console.log("theory checks passed");
