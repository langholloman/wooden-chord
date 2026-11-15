/**
 * A fretted string instrument. Strings are listed from lowest pitch to highest.
 * Pitch classes are enough for shapes; octaves can be added when playback arrives.
 * Re-entrant tunings (ukulele) still work because the diagram cares about pitch class.
 */
export type Instrument = {
  id: string;
  name: string;
  openPitchClasses: readonly number[];
  /** Open-string letter names, lowest string first. */
  stringNames: readonly string[];
};

export const GUITAR_STANDARD: Instrument = {
  id: "guitar-6-standard",
  name: "6-string guitar",
  openPitchClasses: [4, 9, 2, 7, 11, 4],
  stringNames: ["E", "A", "D", "G", "B", "E"],
};

export const BASS_STANDARD: Instrument = {
  id: "bass-4-standard",
  name: "4-string bass",
  openPitchClasses: [4, 9, 2, 7],
  stringNames: ["E", "A", "D", "G"],
};

export const UKULELE_STANDARD: Instrument = {
  id: "ukulele-4-reentrant",
  name: "Ukulele",
  openPitchClasses: [7, 0, 4, 9],
  stringNames: ["G", "C", "E", "A"],
};

export const INSTRUMENTS: readonly Instrument[] = [
  GUITAR_STANDARD,
  BASS_STANDARD,
  UKULELE_STANDARD,
];
