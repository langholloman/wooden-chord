import { ordinal } from "../theory/notes";

/** Six playable fret positions, the nut included when the grip reaches it. */
export const WINDOW_SIZE = 6;

export const STRING_SPACING = 0.158;
export const SIDE_MARGIN = 0.15;
/** Vibrating length used only to space fret wires the way a real neck does. */
export const SCALE_LENGTH = 6.85;

const HEADSTOCK = 0.28;
const END_PAD = 0.05;
const CUT_PAD = 0.034;

export type BoardTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

export type NeckWindow = {
  windowStart: number;
  label: string;
};

export type BoardMetrics = {
  windowStart: number;
  wireStart: number;
  wireEnd: number;
  playableFrets: number[];
  z0: number;
  z1: number;
  length: number;
  width: number;
  zCenter: number;
  stringCount: number;
};

export const SINGLE_INLAYS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
export const DOUBLE_INLAYS = new Set([12, 24]);

export function fretWireZ(fret: number): number {
  if (fret <= 0) return 0;
  return SCALE_LENGTH * (1 - 2 ** (-fret / 12));
}

export function viewWindow(frets: readonly number[]): NeckWindow {
  const min = Math.min(...frets);
  const max = Math.max(...frets);
  // First position: the neck always opens at the nut, so the first fret is the first fret.
  if (min >= 0 && max <= WINDOW_SIZE - 1) {
    return { windowStart: 0, label: "1st fret" };
  }
  let windowStart = min;
  if (max > windowStart + WINDOW_SIZE - 1) {
    windowStart = max - (WINDOW_SIZE - 1);
  }
  const label = windowStart === 0 ? "1st fret" : `${ordinal(windowStart)} fret start`;
  return { windowStart, label };
}

export function boardMetrics(windowStart: number, stringCount: number): BoardMetrics {
  const open = windowStart === 0;
  const wireStart = open ? 0 : windowStart - 1;
  const wireEnd = open ? WINDOW_SIZE - 1 : windowStart - 1 + WINDOW_SIZE;
  const playableFrets = open
    ? Array.from({ length: WINDOW_SIZE }, (_, index) => index)
    : Array.from({ length: WINDOW_SIZE }, (_, index) => windowStart + index);
  const z0 = fretWireZ(wireStart) - (open ? HEADSTOCK : CUT_PAD);
  const z1 = fretWireZ(wireEnd) + END_PAD;
  const length = z1 - z0;
  const width = (stringCount - 1) * STRING_SPACING + SIDE_MARGIN * 2;
  return {
    windowStart,
    wireStart,
    wireEnd,
    playableFrets,
    z0,
    z1,
    length,
    width,
    zCenter: (z0 + z1) / 2,
    stringCount,
  };
}

export function toLocalZ(absoluteZ: number, metrics: BoardMetrics): number {
  return absoluteZ - metrics.zCenter;
}

export function stringX(index: number, count: number): number {
  const span = (count - 1) * STRING_SPACING;
  // Low string along the lower edge, high string along the top.
  return -span / 2 + index * STRING_SPACING;
}

/** Where a finger sits: just behind the fret it plays, or on the headstock when open. */
export function fingerZ(fret: number, metrics: BoardMetrics): number {
  if (fret <= 0) return toLocalZ(-0.08, metrics);
  const behind = fretWireZ(fret - 1);
  const wire = fretWireZ(fret);
  return toLocalZ(behind + (wire - behind) * 0.7, metrics);
}

export function spaceCenterZ(fret: number, metrics: BoardMetrics): number {
  if (fret <= 0) return toLocalZ(-0.08, metrics);
  return toLocalZ((fretWireZ(fret - 1) + fretWireZ(fret)) / 2, metrics);
}

/** Fret where the neck window opens. 0 is the 1st fret, nut included. */
export const FRET_POSITIONS = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function positionWindow(fretStart: number): NeckWindow {
  const windowStart = fretStart <= 0 ? 0 : fretStart;
  const label = windowStart === 0 ? "1st fret" : `${ordinal(windowStart)} fret`;
  return { windowStart, label };
}

/** Every neck sits on this depth so breakouts share the root panel's plane. */
export const SHARED_PLANE_Z = 0.15;

/** Tilt toward the player, then lay the neck sideways so the nut is on the left. */
export const BOARD_ROTATION: [number, number, number] = [0.9, Math.PI / 2, 0];

export const CENTER_TRANSFORM: BoardTransform = {
  position: [0, 0.02, SHARED_PLANE_Z],
  rotation: BOARD_ROTATION,
  scale: 1,
};

/**
 * Six-string ring, low string first. Across is left/right on screen, along runs
 * down the screen, so a negative along sits above the center neck.
 * Low string under the neck, then up the left side, high string at the top.
 */
const GUITAR_SLOTS: Array<[number, number]> = [
  [0.85, 1.42],
  [-0.45, 1.55],
  [-1.95, 0.72],
  [-2.02, -0.12],
  [-0.12, -1.38],
  [1.08, -1.48],
];

/** Point on the center neck's face. `across` is left/right, `along` runs nut to bridge. */
export function onBoardPlane(across: number, along: number): [number, number, number] {
  const [centerX, centerY, centerZ] = CENTER_TRANSFORM.position;
  const tilt = BOARD_ROTATION[0];
  return [centerX + across, centerY - along * Math.sin(tilt), centerZ + along * Math.cos(tilt)];
}

export function satelliteTransform(index: number, count: number): BoardTransform {
  const slot = count === GUITAR_SLOTS.length ? GUITAR_SLOTS[index] : null;
  const angle = Math.PI - (index / Math.max(1, count - 1)) * Math.PI * 1.5;
  const across = slot ? slot[0] : Math.cos(angle) * 2.15;
  const along = slot ? slot[1] : -Math.sin(angle) * 2.28;
  return {
    position: onBoardPlane(across, along),
    rotation: BOARD_ROTATION,
    scale: 0.48,
  };
}
