"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StageView } from "@/components/scene/FretboardScene";
import { StageTools } from "@/components/studio/StageTools";
import { FRET_POSITIONS, positionWindow } from "@/lib/fretboard/layout";
import {
  GUITAR_STANDARD,
  ROLE_COLOR,
  ROLE_NAME,
  SCALES,
  chordName,
  noteName,
  ordinal,
  outsideScaleMessage,
  voiceChord,
  type ChordQuality,
  type ScaleId,
  type Spelling,
} from "@/lib/theory";

const FullNeckBoard = dynamic(
  () => import("@/components/scene/FullNeckBoard").then((mod) => mod.FullNeckBoard),
  {
    ssr: false,
    loading: () => (
      <div className="stage-pending" role="status">
        Setting the neck
      </div>
    ),
  },
);

const ROOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

function windowSpan(fretStart: number): [number, number] {
  if (fretStart <= 0) return [0, 5];
  return [fretStart, fretStart + 5];
}

function ScaleChoice({
  name,
  selected,
  labels,
  onSelect,
  onToggleLabels,
}: {
  name: string;
  selected: boolean;
  labels: boolean;
  onSelect: () => void;
  onToggleLabels: () => void;
}) {
  return (
    <div className="scale-row">
      <button
        type="button"
        aria-pressed={selected}
        className={selected ? "scale-chip is-on" : "scale-chip"}
        onClick={onSelect}
      >
        {name}
      </button>
      <button
        type="button"
        aria-pressed={labels}
        aria-label={`${name} note labels`}
        className={labels ? "label-pill is-on" : "label-pill"}
        onClick={onToggleLabels}
      >
        Labels
      </button>
    </div>
  );
}

export function FullNeck() {
  const viewRef = useRef<StageView | null>(null);
  const [root, setRoot] = useState(7);
  const [quality, setQuality] = useState<ChordQuality>("major");
  const [fretPosition, setFretPosition] = useState(0);
  const [scaleId, setScaleId] = useState<ScaleId | null>(null);
  const [labeledScales, setLabeledScales] = useState<ScaleId[]>([]);
  const [spelling, setSpelling] = useState<Spelling>("sharp");

  const scale = SCALES.find((entry) => entry.id === scaleId) ?? null;
  const neck = positionWindow(fretPosition);
  const [rangeLow, rangeHigh] = windowSpan(fretPosition);
  const outside = scale ? outsideScaleMessage(quality, scale.intervals) : null;
  const modes = SCALES.filter((entry) => entry.group === "mode");
  const pentatonics = SCALES.filter((entry) => entry.group === "pentatonic");
  const showLabels = scale ? labeledScales.includes(scale.id) : false;
  const voicing = useMemo(
    () => voiceChord(GUITAR_STANDARD, root, quality, fretPosition),
    [root, quality, fretPosition],
  );
  const toggleLabels = (id: ScaleId) => {
    setScaleId(id);
    setLabeledScales((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("input, textarea")) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setRoot((current) => (current + 1) % 12);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setRoot((current) => (current + 11) % 12);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const strings = GUITAR_STANDARD.openPitchClasses;
  const rangeLabel =
    rangeLow === 0 ? "Open through the 5th fret" : `Frets ${rangeLow}–${rangeHigh}`;

  return (
    <div className="studio">
      <aside className="panel">
        <header className="panel-head">
          <p className="eyebrow">Standard guitar · E A D G B E</p>
          <h1 className="wordmark">
            <a href="/">Wooden Chord</a>
          </h1>
          <p className="lede">
            Every fret is named. The selected position lights the chord and the scale. The rest of
            the neck stays in shadow.
          </p>
          <nav className="view-nav" aria-label="Neck views">
            <a href="/neck" aria-current="page">
              Full neck
            </a>
            <a href="/focus">Focused neck</a>
            <a href="/thrill">Songs</a>
          </nav>
        </header>

        <section className="control-block">
          <div className="block-label">
            <h2>Root</h2>
            <div className="segment" role="group" aria-label="Note spelling">
              <button
                type="button"
                aria-pressed={spelling === "sharp"}
                className={spelling === "sharp" ? "is-on" : ""}
                onClick={() => setSpelling("sharp")}
              >
                Sharps
              </button>
              <button
                type="button"
                aria-pressed={spelling === "flat"}
                className={spelling === "flat" ? "is-on" : ""}
                onClick={() => setSpelling("flat")}
              >
                Flats
              </button>
            </div>
          </div>
          <div className="root-grid" role="listbox" aria-label="Root note">
            {ROOTS.map((pitch) => (
              <button
                key={pitch}
                type="button"
                role="option"
                aria-selected={pitch === root}
                className={pitch === root ? "root-key is-on" : "root-key"}
                onClick={() => setRoot(pitch)}
              >
                {noteName(pitch, spelling)}
              </button>
            ))}
          </div>
          <p className="hint">
            Left and right arrows step the root. Selector stays in {spelling === "sharp" ? "sharps" : "flats"}.
          </p>
        </section>

        <section className="control-block">
          <h2>Chord</h2>
          <div className="segment segment-wide" role="group" aria-label="Chord quality">
            {(["major", "minor"] as const).map((entry) => (
              <button
                key={entry}
                type="button"
                aria-pressed={quality === entry}
                className={quality === entry ? "is-on" : ""}
                onClick={() => setQuality(entry)}
              >
                {entry === "major" ? "Major" : "Minor"}
              </button>
            ))}
          </div>
          <p className="chord-readout">
            <strong>{chordName(root, quality, spelling)}</strong>
            <span>{neck.label}</span>
          </p>
          <div className="block-label position-label">
            <h2>Fret position</h2>
          </div>
          <div className="root-grid position-grid" role="listbox" aria-label="Fret position">
            {FRET_POSITIONS.map((start) => (
              <button
                key={start}
                type="button"
                role="option"
                aria-selected={start === fretPosition}
                className={start === fretPosition ? "root-key is-on" : "root-key"}
                onClick={() => setFretPosition(start)}
              >
                {start === 0 ? "1st" : ordinal(start)}
              </button>
            ))}
          </div>
          <p className="hint">{rangeLabel} stays lit. Frets outside that window are shadowed.</p>
        </section>

        <section className="control-block">
          <h2>Scale on the neck</h2>
          <div className="scale-list">
            <button
              type="button"
              aria-pressed={scaleId === null}
              className={scaleId === null ? "scale-chip is-on" : "scale-chip"}
              onClick={() => setScaleId(null)}
            >
              Chord only
            </button>
            <p className="scale-group">Modes</p>
            {modes.map((entry) => (
              <ScaleChoice
                key={entry.id}
                name={entry.name}
                selected={scaleId === entry.id}
                labels={labeledScales.includes(entry.id)}
                onSelect={() => setScaleId(entry.id)}
                onToggleLabels={() => toggleLabels(entry.id)}
              />
            ))}
            <p className="scale-group">Pentatonic</p>
            {pentatonics.map((entry) => (
              <ScaleChoice
                key={entry.id}
                name={entry.name}
                selected={scaleId === entry.id}
                labels={labeledScales.includes(entry.id)}
                onSelect={() => setScaleId(entry.id)}
                onToggleLabels={() => toggleLabels(entry.id)}
              />
            ))}
          </div>
          {scale ? (
            <p className="scale-notes">
              {scale.intervals.map((interval) => noteName((root + interval) % 12, spelling)).join("  ")}
            </p>
          ) : null}
          {outside ? <p className="outside">{outside}</p> : null}
        </section>
      </aside>

      <main className="stage neck-stage">
        <FullNeckBoard
          openPitchClasses={strings}
          root={root}
          quality={quality}
          spelling={spelling}
          rangeLow={rangeLow}
          rangeHigh={rangeHigh}
          scaleIntervals={scale?.intervals ?? null}
          showScaleLabels={showLabels}
          grip={voicing.frets}
          title={chordName(root, quality, spelling)}
          subtitle={`${scale ? scale.name : "Chord tones"} · ${rangeLabel}`}
          viewRef={viewRef}
        />
        <aside className="tone-legend" aria-label={`${chordName(root, quality, spelling)} note colors`}>
          <p>{chordName(root, quality, spelling)}</p>
          <ul>
            {(["R", "3", "5"] as const).map((role) => (
              <li key={role}>
                <span className="swatch swatch-glow" style={{ background: ROLE_COLOR[role] }} />
                {ROLE_NAME[role]}
              </li>
            ))}
            <li>
              <span className="swatch swatch-pearl" />
              Scale tone
            </li>
          </ul>
        </aside>
        <p className="stage-hint">Drag to pan · scroll to zoom. Frets outside the position stay in shadow.</p>
        <StageTools viewRef={viewRef} tilt={false} />
      </main>
    </div>
  );
}
