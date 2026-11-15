"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { StageTools } from "@/components/studio/StageTools";
import type { StageView } from "@/components/scene/FretboardScene";
import { FRET_POSITIONS, positionWindow } from "@/lib/fretboard/layout";
import {
  GUITAR_STANDARD,
  ROLE_COLOR,
  ROLE_NAME,
  SCALE_TONE_COLOR,
  SCALES,
  chordName,
  fretPlace,
  noteName,
  ordinal,
  outsideScaleMessage,
  stringName,
  voiceChord,
  type ChordQuality,
  type ScaleId,
  type Spelling,
} from "@/lib/theory";

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

const FretboardScene = dynamic(
  () => import("@/components/scene/FretboardScene").then((mod) => mod.FretboardScene),
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

export function Studio() {
  const [root, setRoot] = useState(7);
  const [quality, setQuality] = useState<ChordQuality>("major");
  const [fretPosition, setFretPosition] = useState(0);
  const [scaleId, setScaleId] = useState<ScaleId | null>(null);
  const [labeledScales, setLabeledScales] = useState<ScaleId[]>([]);
  const [spelling, setSpelling] = useState<Spelling>("sharp");
  const [showBreakouts, setShowBreakouts] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);
  const viewRef = useRef<StageView | null>(null);

  const scale = SCALES.find((entry) => entry.id === scaleId) ?? null;
  const center = useMemo(
    () => voiceChord(GUITAR_STANDARD, root, quality, fretPosition),
    [root, quality, fretPosition],
  );
  const neck = positionWindow(fretPosition);
  const outside = scale ? outsideScaleMessage(quality, scale.intervals) : null;
  const modes = SCALES.filter((entry) => entry.group === "mode");
  const pentatonics = SCALES.filter((entry) => entry.group === "pentatonic");
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

  return (
    <div className="studio">
      <aside className="panel">
        <header className="panel-head">
          <p className="eyebrow">Standard guitar · E A D G B E</p>
          <h1 className="wordmark">
            <a href="/">Wooden Chord</a>
          </h1>
          <p className="lede">
            The center neck holds the chord. Each string, fretted or open, leads to the chord of
            that note. Scale tones stay on the center neck.
          </p>
          <nav className="view-nav" aria-label="Neck views">
            <a href="/neck">Full neck</a>
            <a href="/focus" aria-current="page">
              Focused neck
            </a>
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
          <p className="hint">Left and right arrows step the root. Selector stays in {spelling === "sharp" ? "sharps" : "flats"}.</p>
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
        </section>

        <section className="control-block">
          <h2>Scale on the center neck</h2>
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

        <section className="control-block">
          <div className="block-label">
            <h2>String breakouts</h2>
            <button
              type="button"
              aria-pressed={showBreakouts}
              className={showBreakouts ? "label-pill is-on" : "label-pill"}
              onClick={() => setShowBreakouts((current) => !current)}
            >
              {showBreakouts ? "Hide" : "Show"}
            </button>
          </div>
          <ol className="breakouts">
            {center.frets.map((fret, index) => {
              const pitch = center.pitchClasses[index];
              const hot = hovered === index;
              return (
                <li key={index}>
                  <button
                    type="button"
                    className={hot ? "breakout is-hot" : "breakout"}
                    style={{ ["--dot" as string]: ROLE_COLOR[center.roles[index]] }}
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                  >
                    <RoleDot color={ROLE_COLOR[center.roles[index]]} />
                    <span className="breakout-copy">
                      <strong>
                        {stringName(index, GUITAR_STANDARD.openPitchClasses.length)} ·{" "}
                        {fretPlace(fret, noteName(pitch, spelling))}
                      </strong>
                      <em>{chordName(pitch, quality, spelling)}</em>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <ul className="legend role-legend">
          {(["R", "3", "5"] as const).map((role) => (
            <li key={role}>
              <RoleDot color={ROLE_COLOR[role]} />
              {ROLE_NAME[role]}
            </li>
          ))}
          <li>
            <RoleDot color={SCALE_TONE_COLOR} />
            Scale tone
          </li>
        </ul>
        <p className="fine-print">
          Shapes follow the string count and tuning, so a bass or ukulele neck can use this same
          stage later.
        </p>
      </aside>

      <main className="stage">
        <FretboardScene
          instrument={GUITAR_STANDARD}
          root={root}
          quality={quality}
          scale={scale}
          showScaleLabels={scale ? labeledScales.includes(scale.id) : false}
          spelling={spelling}
          fretStart={fretPosition}
          hovered={hovered}
          onHover={setHovered}
          showBreakouts={showBreakouts}
          viewRef={viewRef}
        />
        <aside className="tone-legend" aria-label={`${chordName(root, quality, spelling)} line colors`}>
          <p>{chordName(root, quality, spelling)}</p>
          <ul>
            {(["R", "3", "5"] as const).map((role) => (
              <li key={role}>
                <RoleDot color={ROLE_COLOR[role]} />
                {ROLE_NAME[role]}
              </li>
            ))}
          </ul>
        </aside>
        <p className="stage-hint">
          {showBreakouts
            ? "Drag a breakout to move it · drag empty space to turn · right-drag to pan"
            : "Drag empty space to turn · right-drag to pan"}
        </p>
        <StageTools viewRef={viewRef} />
      </main>
    </div>
  );
}

function RoleDot({ color }: { color: string }) {
  return (
    <span
      className="swatch"
      style={{ background: color, ["--dot" as string]: color }}
    />
  );
}
