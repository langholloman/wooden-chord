# Music model

All pitch is a pitch class: an integer mod 12. `0` is C and `11` is B. Octaves are not stored. A diagram of where to put a finger does not need them, and a re-entrant string (ukulele's high G) is still just its pitch class.

`normalizePitchClass` in `lib/theory/notes.ts` is the only wrap. Display names are a second step. `Spelling` is `"sharp"` or `"flat"`, and one value labels the whole stage. C# and Db are the same pitch class. Switching spelling does not move a finger.

## Strings

An instrument lists open strings from lowest pitch to highest. See [Instruments](instruments.md).

Guitarists number strings the other way. `stringNumber(index, count)` is `count - index`, so index 0 on a six-string guitar is the 6th string. `fretPlace(0, "D")` is `open D`. `fretPlace(3, "G")` is `3rd fret G`.

## Chords

`lib/theory/chords.ts`

| Quality | Intervals from the root | Pitch-class gaps |
| --- | --- | --- |
| major | root, major 3rd, 5th | 0, 4, 7 |
| minor | root, minor 3rd, 5th | 0, 3, 7 |

`chordRole` classifies a pitch class against a root:

- interval 0 → `R`
- interval 4 in major, or 3 in minor → `3`
- interval 7 → `5`
- anything else → `null`, and `voiceChord` throws if a grip contains one

`outsideScaleMessage` lists chord intervals that are missing from the selected scale, in words (`major 3rd`, `minor 3rd`, `5th`, `root`). An empty result means every chord tone is inside the scale, and the panel stays quiet.

## Scales

`lib/theory/scales.ts`. Intervals are semitones above the selected root.

| Id | Name | Group | Intervals |
| --- | --- | --- | --- |
| `ionian` | Ionian | mode | 0 2 4 5 7 9 11 |
| `dorian` | Dorian | mode | 0 2 3 5 7 9 10 |
| `phrygian` | Phrygian | mode | 0 1 3 5 7 8 10 |
| `lydian` | Lydian | mode | 0 2 4 6 7 9 11 |
| `mixolydian` | Mixolydian | mode | 0 2 4 5 7 9 10 |
| `aeolian` | Aeolian | mode | 0 2 3 5 7 8 10 |
| `locrian` | Locrian | mode | 0 1 3 5 6 8 10 |
| `major-pentatonic` | Major pentatonic | pentatonic | 0 2 4 7 9 |
| `minor-pentatonic` | Minor pentatonic | pentatonic | 0 3 5 7 10 |

Degree names for the interval from the chord root are `DEGREE_LABEL`: R, ♭2, 2, ♭3, 3, 4, ♭5, 5, ♭6, 6, ♭7, 7.

`scaleMarkers` builds the overlay:

1. Shift the scale intervals by the center root into pitch classes.
2. Walk every playable fret of the center window, on every string.
3. Skip a fret the chord grip already uses on that string.
4. Keep the fret when its pitch class is in the scale, and record the degree.

Satellites never call this function. Passing intervals only into the center `Fretboard` is what keeps the overlay off the surrounding necks.

## Guitar grips

`guitarFrets` in `lib/theory/voicing.ts` runs only when the instrument id is `guitar-6-standard` and there are six strings. `rootFret` is the lowest fret (0–11) where the low E string plays the root.

Major, `rootFret >= 3`: the G shape, which is the open-G grip slid up the neck.

```
[rootFret, rootFret - 1, rootFret - 3, rootFret - 3, rootFret - 3, rootFret]
```

G is `rootFret` 3, so the frets are `3 2 0 0 0 3`.

Major, `rootFret` 0, 1, or 2: the E shape, including open E at the nut.

```
[rootFret, rootFret + 2, rootFret + 2, rootFret + 1, rootFret, rootFret]
```

Minor, any root: the E minor shape. Open E minor is `0 2 2 0 0 0`.

```
[rootFret, rootFret + 2, rootFret + 2, rootFret, rootFret, rootFret]
```

Frets are low string to high string. `voiceChord` rejects a negative fret and rejects a pitch that is not a chord tone.

Grips the check script names outright:

| Chord | Pitch class | Frets | Window label |
| --- | --- | --- | --- |
| E major | 4 | 0 2 2 1 0 0 | Open position |
| E minor | 4 | 0 2 2 0 0 0 | Open position |
| F major | 5 | 1 3 3 2 1 1 | 1st fret start |
| G major | 7 | 3 2 0 0 0 3 | Open position |
| G minor | 7 | 3 5 5 3 3 3 | 3rd fret start |
| B major | 11 | 7 6 4 4 4 7 | 4th fret start |
| C major | 0 | 8 7 5 5 5 8 | 5th fret start |
| D major | 2 | 10 9 7 7 7 10 | 7th fret start |

C, D, and the window labels for F and G minor follow the same rules. The check script locks the first six rows and the two window labels, and then checks every root.

## The six-fret window

`viewWindow` in `lib/fretboard/layout.ts`:

1. `windowStart` is the lowest fret in the grip.
2. If the highest fret would fall past `windowStart + 5`, the start moves forward until the grip fits. Current grips span at most four frets, so this branch is a guard.
3. Start 0 is labeled `Open position`. Any other start is labeled with `ordinal`, as in `4th fret start`.

`boardMetrics` turns that start into wood:

- Open window: wires from the nut (fret 0) through fret 5. Playable frets are 0, 1, 2, 3, 4, 5. A short headstock extends behind the nut.
- Any other window: the board starts at the wire *before* `windowStart`, so the finger space of the first fret is on the wood. Six playable frets run from `windowStart` through `windowStart + 5`. The nut-side end is a brass cap instead of a headstock.

`WINDOW_SIZE` is 6. A finger for fret `n` sits 70% of the way from wire `n - 1` to wire `n`, toward the sounding fret. An open string sits on the headstock, just behind the nut.

## Other instruments

Anything that is not six-string standard guitar uses `genericFrets`. It slides a five-fret-wide grip (anchor through anchor + 4) from fret 0 upward and keeps the lowest, tightest grip that puts a chord tone on every string and includes the root somewhere. Inside a grip it prefers a root on a string over another chord tone. If no anchor works, each string takes the chord tone nearest the root's fret on the lowest string.

The ukulele check expects C major to come out as `0 0 0 3`, the usual open C. That is the generic finder, not a ukulele-specific table.

## Adding a chord quality

A new quality needs four things, then a check:

1. An entry in `CHORD_INTERVALS` and a branch in `chordRole`.
2. A spoken name in `INTERVAL_SPOKEN` for any new interval the panel might call "outside the scale".
3. A grip. For guitar, a function next to `guitarFrets` that returns one fret per string, all chord tones, none negative. For other instruments the generic search will try on its own, and the check will say if a string cannot be filled inside a six-fret window.
4. Rows in `scripts/check-theory.ts` for the shapes you care about by name, plus the existing all-roots loop.
