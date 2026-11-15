# System

Wooden Chord is a fretboard studio for learning how a chord sits on a string instrument, and what chord each of those notes opens into. The first instrument is six-string guitar in standard tuning. The same stage is built to take other fretted instruments later.

## The picture

One large neck sits in the center. It holds a single chord grip. Every sounding string on that grip, fretted or open, grows a brass wire out to a smaller neck. The smaller neck is the chord of the note on that string, in the same quality (major stays major, minor stays minor).

The opening picture is G major:

| String | Where the note is | Breaks out to |
| --- | --- | --- |
| 6th | 3rd fret G | G major |
| 5th | 2nd fret B | B major |
| 4th | open D | D major |
| 3rd | open G | G major |
| 2nd | open B | B major |
| 1st | 3rd fret G | G major |

Low E is the 6th string and the first entry in the tuning array. High E is the 1st string and the last entry. Three of those breakouts are G major and two are B major. They stay as six necks, because each string is its own path even when the pitch class repeats.

B major on this grip is frets `7 6 4 4 4 7`. The neck is cropped to six frets and the brass plate reads **4th fret start**.

## What you can change

State lives in `components/studio/Studio.tsx`.

| Control | Effect |
| --- | --- |
| Root, twelve notes | Rebuilds the center grip and every breakout. Left and right arrows do the same. |
| Sharps / Flats | Relabels every note on the panel and on the necks. The pitches do not move. |
| Major / Minor | Switches the grip family. Breakouts use the same quality. |
| Scale list | Draws scale degrees on the center neck only. **Chord only** clears them. |
| String breakout row | Hover or focus highlights that wire and both necks it joins. |

The scale list is the seven modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian) and major and minor pentatonic. Ionian is the major scale. When a chord tone is missing from the selected scale, the panel says `Not in this scale: …`. Dorian over a major chord produces `Not in this scale: major 3rd.` The chord marker stays. The scale does not erase the chord.

## What a neck shows

Each neck is six playable fret positions.

- If the lowest fingered fret is 0, the plate says **Open position** and the nut is on the board. Playable frets are 0 through 5.
- Otherwise the plate says **Nth fret start**. The board includes the space in front of that fret, and the six positions begin there. A grip whose lowest fret is 4 is labeled **4th fret start** and shows frets 4 through 9.

Inlays follow the usual guitar map: single dots at 3, 5, 7, 9, 15, 17, 19, 21 and double dots at 12 and 24, drawn only when that fret is inside the window. The center neck also prints the fret number beside each space. Satellite necks keep the plate and the inlays, and leave the per-fret numbers off so the small boards stay readable.

Marker color is the note's job in the chord:

| Role | Meaning | Color |
| --- | --- | --- |
| R | Root | `#e4b15c` gold |
| 3 | 3rd | `#e07a45` copper |
| 5 | 5th | `#d7d0c2` bone |

Scale-only positions are smaller pearl dots. A scale root that is not already a chord finger is gold.

## Layout of the page

At 900px and wider, a 360px panel sits on the left and the WebGL stage fills the rest. Below 900px the stage is the top 57% of the viewport and the panel scrolls underneath it. The stage is client-only. The server renders the "Setting the neck" placeholder, then the canvas mounts in the browser.

## Not in this version

There is no audio, no saved layouts, no accounts, and no instrument switch in the panel. The studio always passes `GUITAR_STANDARD`. Bass and ukulele exist as data and as voicing tests, described in [Instruments](instruments.md).

Every string of a grip sounds. Familiar shapes that mute a string, such as open D `x x 0 2 3 2`, are not the grips used here. The guitar path chooses a six-note grip so each string can break out. Adding a mute means teaching the scene to skip that string. See [Music model](theory.md).
