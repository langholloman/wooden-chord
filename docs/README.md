# Wooden Chord documentation

Reference for the people building Wooden Chord. The running app does not import this directory, and Next.js does not serve it.

Routes come from `app/`. Files the browser can request come from `public/`. `docs/` is on neither path. `next.config.ts` also lists `./docs/**/*` in `outputFileTracingExcludes`, so the production server trace leaves the folder behind. `tsconfig.json` excludes `docs` from the TypeScript program.

## Start here

| Document | What it answers |
| --- | --- |
| [System](system.md) | What the current app shows, and the controls that change it |
| [Architecture](architecture.md) | How a root note becomes necks, wires, and a panel |
| [Music model](theory.md) | Pitch classes, chords, scales, grips, and the six-fret window |
| [Scene](scene.md) | How one wooden neck is built and how the breakout necks are placed |
| [Instruments](instruments.md) | How a guitar, bass, or ukulele is described, and how to add another |
| [Persistence](persistence.md) | Why there is no database yet, and the PostgreSQL shape to add later |

## Work on the app

```bash
npm run dev      # http://localhost:3000
npm run check    # every root, both qualities, guitar bass and ukulele
npm run lint
npm run build
```

The dev server opens on G major, open position, no scale, sharps. Arrow keys step the root.

`npm run check` runs `scripts/check-theory.ts`. That script is the contract for the grips: a named shape that drifts, a fret below the nut, a non-chord tone, or a note outside the visible window fails the command.
