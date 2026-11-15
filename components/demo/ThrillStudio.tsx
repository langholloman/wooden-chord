"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import type { StageView } from "@/components/scene/FretboardScene";
import { StageTools } from "@/components/studio/StageTools";
import { SONGS, findSong } from "@/lib/demo/library";
import { LESSON_DOT, blueNote, bluesPitchList, bluesSpelling } from "@/lib/demo/song";

const ThrillScene = dynamic(
  () => import("@/components/scene/ThrillScene").then((mod) => mod.ThrillScene),
  {
    ssr: false,
    loading: () => (
      <div className="stage-pending" role="status">
        Setting the necks
      </div>
    ),
  },
);

export function ThrillStudio() {
  const viewRef = useRef<StageView | null>(null);
  const [songId, setSongId] = useState(SONGS[0].id);
  const [bar, setBar] = useState(0);
  const song = findSong(songId);
  const chord = song.form[bar] ?? song.form[0];

  const chooseSong = (id: string) => {
    const next = findSong(id);
    if (next.id === song.id) return;
    setSongId(next.id);
    setBar(0);
  };

  return (
    <div className="studio">
      <aside className="panel">
        <header className="panel-head">
          <p className="eyebrow">{song.player} · demonstration</p>
          <h1 className="wordmark">
            <a href="/">Wooden Chord</a>
          </h1>
          <p className="lede">{song.lede}</p>
          <nav className="view-nav" aria-label="Neck views">
            <a href="/neck">Full neck</a>
            <a href="/focus">Focused neck</a>
            <a href="/thrill" aria-current="page">
              Songs
            </a>
          </nav>
        </header>

        <section className="control-block">
          <label className="song-pick">
            <span>Song</span>
            <select value={song.id} onChange={(event) => chooseSong(event.target.value)}>
              {SONGS.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title}
                </option>
              ))}
            </select>
          </label>
          <p className="thrill-readout">
            <strong>{chord.name}</strong>
            <span>
              {chord.numeral} · bar {bar + 1} of {song.form.length}
            </span>
          </p>
          <div className="bar-strip" role="listbox" aria-label="Chorus bars">
            {song.form.map((entry, index) => (
              <button
                key={`${song.id}-${entry.name}-${index}`}
                type="button"
                role="option"
                aria-selected={index === bar}
                className={index === bar ? "is-on" : ""}
                onClick={() => setBar(index)}
              >
                <b>{index + 1}</b>
                {entry.name}
              </button>
            ))}
          </div>
          <p className="lesson">{chord.lesson}</p>
        </section>

        <section className="control-block">
          <h2>{song.scaleTitle}</h2>
          <p className="scale-notes">{bluesSpelling(song)}</p>
          <ul className="legend thrill-legend">
            <li>
              <Dot color={LESSON_DOT.chord} />
              Chord tone of this bar
            </li>
            <li>
              <Dot color={LESSON_DOT.scale} />
              Other scale tone
            </li>
            <li>
              <Dot color={LESSON_DOT.blue} />
              Blue note
            </li>
            <li>
              <Dot color={LESSON_DOT.outside} />
              Outside the scale
            </li>
          </ul>
          <p className="hint">
            Pick a bar. The rhythm neck shows that chord, and the lead neck keeps the blues scale.
          </p>
        </section>
      </aside>

      <main className="stage neck-stage">
        <ThrillScene
          chordName={chord.name}
          chordFrets={chord.frets}
          chordTones={chord.tones}
          bluesPitches={bluesPitchList(song.root)}
          blueNote={blueNote(song.root)}
          spelling={song.spelling}
          windowStart={song.windowStart}
          windowEnd={song.windowEnd}
          leadKicker={song.leadKicker}
          leadTitle={song.leadTitle}
          leadSubtitle={song.leadSubtitle}
          lead={null}
          strum={false}
          viewRef={viewRef}
        />
        <p className="stage-hint">Drag to pan · scroll to zoom. Rhythm guitar on top. Lead guitar underneath.</p>
        <StageTools viewRef={viewRef} tilt={false} />
      </main>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="swatch"
      style={{ background: color, ["--dot" as string]: color }}
    />
  );
}
