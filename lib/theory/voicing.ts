import { chordPitchClasses, chordRole, type ChordQuality, type ChordRole } from "./chords";
import { GUITAR_STANDARD, type Instrument } from "./instruments";
import { normalizePitchClass } from "./notes";

export type Voicing = {
  /** Absolute fret per string, lowest string first. Every string sounds. */
  frets: number[];
  pitchClasses: number[];
  roles: ChordRole[];
};

function pitchAt(openPitchClass: number, fret: number): number {
  return normalizePitchClass(openPitchClass + fret);
}

/** Six frets, matching the neck window. Position 0 includes the open strings. */
const WINDOW_FRETS = 6;

function spanBounds(fretStart: number): [number, number] {
  const start = Math.max(0, Math.round(fretStart));
  if (start === 0) return [0, WINDOW_FRETS - 1];
  return [start, start + WINDOW_FRETS - 1];
}

function inSpan(frets: readonly number[], low: number, high: number): boolean {
  return frets.every((fret) => fret >= low && fret <= high);
}

/**
 * Familiar guitar grips when they sit inside the selected fret window.
 * Open G is 3 2 0 0 0 3. The E-shape takes over once that window moves up the neck.
 */
function cagedGuitar(
  openLow: number,
  root: number,
  quality: ChordQuality,
  low: number,
  high: number,
): number[] | null {
  const rootFret = normalizePitchClass(root - openLow);
  const shapes: number[][] = [];
  for (const base of [rootFret, rootFret + 12]) {
    if (quality === "major") {
      shapes.push([base, base - 1, base - 3, base - 3, base - 3, base]);
      shapes.push([base, base + 2, base + 2, base + 1, base, base]);
    } else {
      shapes.push([base, base + 2, base + 2, base, base, base]);
    }
  }
  const fitting = shapes.filter((frets) => inSpan(frets, low, high));
  if (fitting.length === 0) return null;
  fitting.sort((a, b) => {
    const average = (frets: number[]) => frets.reduce((sum, fret) => sum + fret, 0) / frets.length;
    return average(a) - average(b);
  });
  return fitting[0];
}

/** Best chord tone on every string inside the fret window. Null when a string has none. */
function fretsInSpan(
  instrument: Instrument,
  root: number,
  quality: ChordQuality,
  low: number,
  high: number,
): number[] | null {
  const tones = new Set(chordPitchClasses(root, quality));
  const opens = instrument.openPitchClasses;
  const choices = opens.map((open) => {
    const frets: number[] = [];
    for (let fret = low; fret <= high; fret += 1) {
      if (tones.has(pitchAt(open, fret))) frets.push(fret);
    }
    return frets;
  });
  if (choices.some((frets) => frets.length === 0)) return null;

  let best: number[] | null = null;
  let bestScore = Infinity;
  const chosen: number[] = [];

  const walk = (stringIndex: number) => {
    if (stringIndex === choices.length) {
      const span = Math.max(...chosen) - Math.min(...chosen);
      let jumps = 0;
      let roots = 0;
      let opensUsed = 0;
      for (let index = 0; index < chosen.length; index += 1) {
        if (index > 0) jumps += Math.abs(chosen[index] - chosen[index - 1]);
        if (pitchAt(opens[index], chosen[index]) === root) roots += 1;
        if (chosen[index] === 0) opensUsed += 1;
      }
      const lowIsRoot = pitchAt(opens[0], chosen[0]) === root ? -5 : 0;
      const average = chosen.reduce((sum, fret) => sum + fret, 0) / chosen.length;
      const score =
        average * 8 + span * 3 + jumps + Math.min(...chosen) * 4 - roots * 4 - opensUsed * 3 + lowIsRoot;
      if (score < bestScore) {
        bestScore = score;
        best = [...chosen];
      }
      return;
    }
    for (const fret of choices[stringIndex]) {
      chosen.push(fret);
      walk(stringIndex + 1);
      chosen.pop();
    }
  };

  walk(0);
  return best;
}

/**
 * Fallback for other string counts and tunings. Slides a 5-fret grip until
 * every string has a chord tone, preferring a low position that includes the root.
 */
function genericFrets(instrument: Instrument, root: number, quality: ChordQuality): number[] {
  const toneSet = new Set(chordPitchClasses(root, quality));
  const opens = instrument.openPitchClasses;
  let best: number[] | null = null;
  let bestScore = Infinity;

  for (let anchor = 0; anchor <= 14; anchor += 1) {
    const frets: number[] = [];
    let ok = true;
    for (const open of opens) {
      let chosen: number | null = null;
      for (let fret = anchor; fret <= anchor + 4; fret += 1) {
        const pitch = pitchAt(open, fret);
        if (!toneSet.has(pitch)) continue;
        if (chosen === null || (pitch === root && pitchAt(open, chosen) !== root)) {
          chosen = fret;
        }
      }
      if (chosen === null) {
        ok = false;
        break;
      }
      frets.push(chosen);
    }
    if (!ok) continue;
    const hasRoot = frets.some((fret, index) => pitchAt(opens[index], fret) === root);
    if (!hasRoot) continue;
    const span = Math.max(...frets) - Math.min(...frets);
    const score = Math.min(...frets) * 3 + span * 4;
    if (score < bestScore) {
      bestScore = score;
      best = frets;
    }
  }

  if (best) return best;

  const target = normalizePitchClass(root - opens[0]);
  return opens.map((open) => {
    let bestFret = 0;
    let bestDist = Infinity;
    for (let fret = 0; fret <= 15; fret += 1) {
      if (!toneSet.has(pitchAt(open, fret))) continue;
      const dist = Math.abs(fret - target);
      if (dist < bestDist) {
        bestDist = dist;
        bestFret = fret;
      }
    }
    return bestFret;
  });
}

export function voiceChord(
  instrument: Instrument,
  root: number,
  quality: ChordQuality,
  fretStart = 0,
): Voicing {
  const tonic = normalizePitchClass(root);
  const [low, high] = spanBounds(fretStart);
  const caged =
    instrument.id === GUITAR_STANDARD.id && instrument.openPitchClasses.length === 6
      ? cagedGuitar(instrument.openPitchClasses[0], tonic, quality, low, high)
      : null;
  const frets = caged ?? fretsInSpan(instrument, tonic, quality, low, high) ?? genericFrets(instrument, tonic, quality);

  const pitchClasses = frets.map((fret, index) =>
    pitchAt(instrument.openPitchClasses[index], fret),
  );
  const roles = pitchClasses.map((pitch) => {
    const role = chordRole(pitch, tonic, quality);
    if (!role) {
      throw new Error(
        `Voicing ${frets.join(" ")} on ${instrument.id} leaves a non-chord tone for ${quality} ${tonic}`,
      );
    }
    return role;
  });

  if (frets.some((fret) => fret < 0)) {
    throw new Error(`Voicing ${frets.join(" ")} on ${instrument.id} goes below the nut`);
  }

  return { frets, pitchClasses, roles };
}

export type ScaleMarker = {
  stringIndex: number;
  fret: number;
  pitchClass: number;
  degree: number;
};

/** Scale tones inside the visible fret window, skipping frets already held by the chord. */
export function scaleMarkers(
  instrument: Instrument,
  voicing: Voicing,
  playableFrets: readonly number[],
  root: number,
  intervals: readonly number[],
): ScaleMarker[] {
  const tonic = normalizePitchClass(root);
  const scale = new Set(intervals.map((interval) => (tonic + interval) % 12));
  const held = new Set(voicing.frets.map((fret, index) => `${index}:${fret}`));
  const markers: ScaleMarker[] = [];

  for (let stringIndex = 0; stringIndex < instrument.openPitchClasses.length; stringIndex += 1) {
    const open = instrument.openPitchClasses[stringIndex];
    for (const fret of playableFrets) {
      if (held.has(`${stringIndex}:${fret}`)) continue;
      const pitchClass = pitchAt(open, fret);
      if (!scale.has(pitchClass)) continue;
      markers.push({
        stringIndex,
        fret,
        pitchClass,
        degree: (pitchClass - tonic + 12) % 12,
      });
    }
  }

  return markers;
}
