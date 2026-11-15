export type ScaleId =
  | "ionian"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "aeolian"
  | "locrian"
  | "major-pentatonic"
  | "minor-pentatonic";

export type ScaleGroup = "mode" | "pentatonic";

export type ScaleDefinition = {
  id: ScaleId;
  name: string;
  group: ScaleGroup;
  intervals: readonly number[];
};

export const SCALES: readonly ScaleDefinition[] = [
  { id: "ionian", name: "Ionian", group: "mode", intervals: [0, 2, 4, 5, 7, 9, 11] },
  { id: "dorian", name: "Dorian", group: "mode", intervals: [0, 2, 3, 5, 7, 9, 10] },
  { id: "phrygian", name: "Phrygian", group: "mode", intervals: [0, 1, 3, 5, 7, 8, 10] },
  { id: "lydian", name: "Lydian", group: "mode", intervals: [0, 2, 4, 6, 7, 9, 11] },
  { id: "mixolydian", name: "Mixolydian", group: "mode", intervals: [0, 2, 4, 5, 7, 9, 10] },
  { id: "aeolian", name: "Aeolian", group: "mode", intervals: [0, 2, 3, 5, 7, 8, 10] },
  { id: "locrian", name: "Locrian", group: "mode", intervals: [0, 1, 3, 5, 6, 8, 10] },
  {
    id: "major-pentatonic",
    name: "Major pentatonic",
    group: "pentatonic",
    intervals: [0, 2, 4, 7, 9],
  },
  {
    id: "minor-pentatonic",
    name: "Minor pentatonic",
    group: "pentatonic",
    intervals: [0, 3, 5, 7, 10],
  },
];

export function findScale(id: ScaleId): ScaleDefinition {
  const scale = SCALES.find((entry) => entry.id === id);
  if (!scale) throw new Error(`Unknown scale ${id}`);
  return scale;
}

export const DEGREE_LABEL = [
  "R",
  "♭2",
  "2",
  "♭3",
  "3",
  "4",
  "♭5",
  "5",
  "♭6",
  "6",
  "♭7",
  "7",
] as const;

export function scaleDegree(pitchClass: number, root: number): number {
  return (((pitchClass - root) % 12) + 12) % 12;
}
