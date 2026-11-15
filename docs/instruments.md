# Instruments

A neck is a list of open strings. The scene asks the instrument how many strings it has and what pitch class each open string is. It does not special-case the number 6 except inside the guitar grip picker.

`lib/theory/instruments.ts`:

```ts
type Instrument = {
  id: string
  name: string
  openPitchClasses: readonly number[]  // lowest pitch first
  stringNames: readonly string[]       // same order, letter names
}
```

| Id | Name | Open pitch classes | Names |
| --- | --- | --- | --- |
| `guitar-6-standard` | 6-string guitar | 4 9 2 7 11 4 | E A D G B E |
| `bass-4-standard` | 4-string bass | 4 9 2 7 | E A D G |
| `ukulele-4-reentrant` | Ukulele | 7 0 4 9 | G C E A |

Pitch class 4 is E, 9 is A, 2 is D, 7 is G, 11 is B, 0 is C. The ukulele's G is the re-entrant high string on a real soprano ukulele. The diagram still treats it as G. Octave and string order on the instrument (which physical string is "on top") are not modeled. When playback is added, octaves belong on the string record, next to the pitch class.

`INSTRUMENTS` lists the three profiles. The panel does not offer the list yet. `Studio` always passes `GUITAR_STANDARD` into the scene.

## Which grip runs

`voiceChord` uses `guitarFrets` only when the id is `guitar-6-standard` and `openPitchClasses.length === 6`. Drop a string, or change the id, and the generic finder runs. That split is deliberate: the G shape `3 2 0 0 0 3` is a guitar fact, not something a search over arbitrary tunings should have to rediscover. The generic finder is the path a new tuning gets on day one, and a dedicated grip can replace it when a textbook shape matters.

`npm run check` builds every major and minor chord for all twelve roots on all three instruments. It requires:

- one fret per string
- every pitch a chord tone of that root and quality
- the root present on at least one string
- no fret below 0
- every fret inside the six-fret window `viewWindow` computes

It also locks ukulele C major to `0 0 0 3`.

## Adding an instrument

1. Add an `Instrument` constant and put it on `INSTRUMENTS`.
2. If the textbook grips matter, teach `voiceChord` to recognize the id and return those frets. Otherwise leave it on `genericFrets` and read what the finder produces.
3. Add the instrument to the `checkInstrument` calls in `scripts/check-theory.ts`. Name any grip you want frozen, the way G major is frozen.
4. When the panel grows a switch, pass the chosen instrument through `Studio` into `FretboardScene`. The scene already sizes the ring with `satelliteTransform(index, count)` and the neck width with `stringCount`, so four strings become four breakout necks without a new component.

A muted string is not representable yet. `Voicing.frets` is `number[]`, and the scene draws a marker and a satellite for every entry. A mute should become an empty fret on that string, and both the wire loop and the panel list should skip it. Until that exists, grips are written so every string sounds.

String *names* (`E`, `A`, `D`…) are the open-string letters for display of the tuning. The breakout copy uses `stringName`, which is "6th string", not the letter. The letter comes from the note at the fretted position.
