# Architecture

The music math is plain TypeScript. React holds the controls. React Three Fiber draws the necks. Nothing in the request path reads a database or a file of shapes.

```
app/page.tsx                         server page, renders <Studio />
app/layout.tsx                       Fraunces + Outfit, document title
components/studio/Studio.tsx         root, quality, scale, spelling, hover
components/scene/FretboardScene.tsx  canvas, one center neck, one neck per string, wires
components/scene/Fretboard.tsx       a single neck: wood, frets, strings, markers, labels
components/scene/wood.ts             procedural neck and fingerboard textures
lib/theory/                          pitch, chords, scales, instruments, voicings
lib/fretboard/layout.ts              fret spacing, window, where a finger sits, where necks sit
scripts/check-theory.ts              grip contract, run with npm run check
```

`lib/theory` does not import React or Three. `lib/fretboard/layout.ts` does not either. Both can run under `tsx` in the check script.

## From a click to a picture

`Studio` keeps five pieces of state:

- `root` — pitch class 0–11, starting at 7 (G)
- `quality` — `"major"` or `"minor"`
- `scaleId` — a `ScaleId`, or `null` for chord only
- `spelling` — `"sharp"` or `"flat"`
- `hovered` — which center string is highlighted, or `null`

The panel calls `voiceChord(GUITAR_STANDARD, root, quality)` and lists one row per string. The stage receives the instrument and the same state. It calls `voiceChord` again for the center neck, then once per sounding pitch for the breakout necks. Both sides stay aligned because the function is pure: the same root, quality, and instrument always return the same frets.

```
root + quality + instrument
        │
        ▼
   voiceChord()  ── frets, pitch classes, roles
        │
        ├── panel rows (string name, fret, breakout chord)
        │
        └── FretboardScene
              ├── center Fretboard  (+ scale intervals, if any)
              ├── satellite Fretboard × string count
              └── brass tubes from each center marker
                    to that satellite's root marker
```

The canvas is loaded with `next/dynamic` and `ssr: false`. A WebGL canvas has nothing to draw during the server render, so the server ships the placeholder and the scene module loads in the browser.

## Where a behavior lives

| Change | Edit |
| --- | --- |
| A chord grip, or which grip is chosen | `lib/theory/voicing.ts`, then `npm run check` |
| A scale's intervals or its name | `lib/theory/scales.ts` |
| Note spelling, string wording | `lib/theory/notes.ts` |
| Role colors | `lib/theory/chords.ts` (`ROLE_COLOR` is shared by the panel and the wires) |
| How many frets are visible, inlays, finger placement | `lib/fretboard/layout.ts` |
| Where the small necks sit, camera | `satelliteTransform` / `CENTER_TRANSFORM`, and the camera in `FretboardScene.tsx` |
| Wood grain | `components/scene/wood.ts` |
| A control on the panel | `components/studio/Studio.tsx` |
| Another instrument in the math | `lib/theory/instruments.ts`, the check script, and later the panel. See [Instruments](instruments.md). |

## Wires

Tubes are not placed from a second copy of the layout math. After the necks mount, the scene reads each marker's world position with `updateWorldMatrix` and builds a quadratic tube from the center marker to the satellite's root marker. The arc lifts the midpoint in Y. Measurement retries for a few frames if a marker ref is not ready yet. Hover changes tube radius and opacity. It does not move the necks, so the measured endpoints stay put.

The satellite end of a wire is the first string whose role is `R`. Both current guitar grips put a root on the lowest string, so the wire arrives on that root.

## Scale overlay

`Studio` resolves `scaleId` to a `ScaleDefinition` and passes it to the scene. The center `Fretboard` receives `scale.intervals`. Every satellite is called with `scaleIntervals={null}`. `scaleMarkers` then walks the center window and skips any string/fret the chord is already holding, so a chord finger and a scale dot never occupy the same spot.

## Hover

On the center neck, each marker reports its own string index. On a satellite, every marker reports the index of the center string that spawned that neck (`linkIndex`). The panel rows call the same `setHovered`. One index drives the wire, the center marker, and the whole satellite together.
