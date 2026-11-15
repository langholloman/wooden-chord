# Scene

One `Fretboard` draws one cropped neck. `FretboardScene` places the center neck, places one smaller copy per string, and draws the wires after it can read real world positions.

The canvas background is `#14110e`. Tone mapping is ACES Filmic at exposure 1.18. Lighting is an ambient fill, a warm key from the front, a cool rim, a spotlight, and a baked environment of three rectangles (`Lightformer`) so the metal frets and the clearcoat on the wood have something to reflect. Orbit controls dolly and rotate around `[0, 0.35, 0]`. Pan is off. Distance stays between 4.6 and 12.

The camera starts at `[0, 2.7, 8.15]` with a 42° vertical field of view. That distance is what fits six necks in the stage. If the ring of necks is changed, change the camera with it.

## Neck coordinates

Inside a neck group:

- X runs across the strings. The lowest string is at negative X.
- Y is up from the fingerboard face.
- Z runs from the nut toward the bridge. Fret wire `n` is at `SCALE_LENGTH * (1 - 2^(-n/12))`, with `SCALE_LENGTH` 6.85. Fret 0, the nut, is at 0. The group is centered on that cropped length, so local Z is the absolute fret position minus the board center.

The group is rotated `+0.72` radians on X. Positive X rotation tips the fingerboard toward the camera, which sits on positive Z. The nut end rises toward the top of the view and the higher frets come toward the camera. Both the center neck and the satellites share that rotation, so they read as the same kind of board.

`CENTER_TRANSFORM` and `satelliteTransform` in `lib/fretboard/layout.ts` are the placement. Satellites travel a semicircle: string index 0 (lowest string) on the left, the last string on the right, and the middle strings along the top. Scale is `0.5`. The horizontal radius is 1.72 and the vertical radius is 1.42. Those numbers are tuned so the wires have room and the outer necks stay inside a narrow stage. Widening the ring without moving the camera clips the outer necks.

## What the mesh is made of

From the back of the neck toward the player, `Fretboard.tsx` stacks:

| Piece | Material |
| --- | --- |
| Neck body | Mahogany-range grain, light clearcoat |
| Binding | Thin maple strip `#ead8b4` |
| Fingerboard | Darker rosewood grain, drier clearcoat |
| Nut, open windows only | Bone `#f4ecdc` |
| Cut end, every other window | Brass cap on the nut side, the "this neck starts later" face |
| Fret wires | Nickel boxes, high metalness. Fret 0 is the nut, not a wire. |
| Strings | Cylinders. The highest two strings are plain steel. The lower strings are a duller wound color and thicker toward the low string. |
| Inlays | Pearl discs in the fret space, plus a small side dot on the bass edge |
| Chord marker | A wood peg with a colored cap, or a torus around an open string |
| Scale marker | A small pearl sphere, center neck only |

Grain is generated on a canvas in `wood.ts`: rings across the board, fine lines and pores along it, and a matching roughness map so the dark grain is rougher. One neck texture and one fingerboard texture are cached for the whole page. Satellites share them. The generator needs `document`, which is safe because the scene module only mounts in the browser.

Labels are troika `Text` on a `Billboard`, so they face the camera and stay in the WebGL scene. Each text mesh preloads a shared glyph set that includes the sharp, flat, and letters used in titles. Chord titles, the fret-start plate, fret numbers, and note names all go through `FaceText`. The plate is a brass plane behind the words.

A transparent cylinder on each chord marker is the pointer target. It is what hover uses, and it is the object whose world position becomes the end of a wire.

## Wires

`BrassWire` builds a `TubeGeometry` along a quadratic curve. Color is `ROLE_COLOR` of that string's role in the *center* chord, so a root wire stays gold even when it arrives at a different chord. The unfocused wires drop to opacity 0.12. The focused wire is thicker and brighter. Geometry is disposed when the curve changes.

## Responsive stage

The canvas fills `.stage`. Above 900px that element is the flexible column beside the 360px panel. Below 900px `.stage` is ordered first, taken out of flex grow (`flex: none`), and given 57dvh. The panel scrolls in the remaining height. The camera does not change with the viewport. The ring radii were chosen so the outer necks still fit when the stage is a phone-width column.
