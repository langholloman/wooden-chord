"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  BAR_COUNT,
  FORM,
  LEAD,
  barSeconds,
  beatSeconds,
  BPM,
  bluesSpelling,
  chorusSeconds,
  frequency,
  leadElapsed,
  midiNote,
  pitchClass,
  placeAt,
  type Playhead,
} from "@/lib/demo/thrill";
import { makeNoise, playBacking, type BandVoice } from "@/lib/demo/thrill-band";
import { noteName } from "@/lib/theory";

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

const REST: Playhead = { bar: 0, beat: 0, noteIndex: null, strum: false };

export function ThrillStudio() {
  const [playhead, setPlayhead] = useState<Playhead>(REST);
  const [running, setRunning] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const originRef = useRef(0);
  const runningRef = useRef(false);
  const scheduledRef = useRef(new Set<string>());
  const voicesRef = useRef<BandVoice[]>([]);
  const noiseRef = useRef<AudioBuffer | null>(null);
  const elapsedRef = useRef(0);

  const chord = FORM[playhead.bar];
  const sounding = playhead.noteIndex === null ? null : LEAD[playhead.noteIndex];

  useEffect(() => {
    const schedule = () => {
      const ctx = ctxRef.current;
      const master = masterRef.current;
      const noise = noiseRef.current;
      if (!ctx || !master || !noise || !runningRef.current) return;
      const now = ctx.currentTime;
      const from = Math.max(0, now - originRef.current);
      const to = now + 0.35 - originRef.current;
      const chorus = chorusSeconds();
      const firstLoop = Math.floor(from / chorus);
      const lastLoop = Math.floor(Math.max(from, to - 0.0001) / chorus);
      for (let loop = firstLoop; loop <= lastLoop; loop += 1) {
        FORM.forEach((_, bar) => {
          const elapsed = (loop * BAR_COUNT + bar) * barSeconds();
          if (elapsed < from - 0.12 || elapsed >= to) return;
          const key = `${loop}:band:${bar}`;
          if (scheduledRef.current.has(key)) return;
          scheduledRef.current.add(key);
          playBacking(ctx, master, voicesRef.current, noise, originRef.current + elapsed, bar);
        });
        LEAD.forEach((note, index) => {
          const elapsed = leadElapsed(note, loop);
          if (elapsed < from - 0.08 || elapsed >= to) return;
          const key = `${loop}:lead:${index}`;
          if (scheduledRef.current.has(key)) return;
          scheduledRef.current.add(key);
          pluck(
            ctx,
            master,
            voicesRef.current,
            originRef.current + elapsed,
            midiNote(note.string, note.fret),
            Math.min(note.duration * beatSeconds() * 0.92, 1.6),
            0.1,
          );
        });
      }
      const chorusLoop = Math.floor(Math.max(0, now - originRef.current) / chorus);
      if (chorusLoop > 0) {
        for (const key of scheduledRef.current) {
          const loop = Number(key.slice(0, key.indexOf(":")));
          if (loop < chorusLoop) scheduledRef.current.delete(key);
        }
      }
    };

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const ctx = ctxRef.current;
      if (!runningRef.current || !ctx) return;
      const elapsed = ctx.currentTime - originRef.current;
      elapsedRef.current = elapsed;
      const next = placeAt(elapsed);
      setPlayhead((current) =>
        current.bar === next.bar && current.noteIndex === next.noteIndex && current.strum === next.strum
          ? current
          : next,
      );
    };
    frame = requestAnimationFrame(tick);
    const timer = window.setInterval(schedule, 70);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      void ctxRef.current?.close();
    };
  }, []);

  const ensureContext = () => {
    if (ctxRef.current) return ctxRef.current;
    const ctx = new AudioContext();
    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    master.gain.value = 0.85;
    compressor.threshold.value = -16;
    compressor.knee.value = 12;
    compressor.ratio.value = 2.6;
    compressor.attack.value = 0.012;
    compressor.release.value = 0.2;
    master.connect(compressor);
    compressor.connect(ctx.destination);
    ctxRef.current = ctx;
    masterRef.current = master;
    noiseRef.current = makeNoise(ctx);
    return ctx;
  };

  const silence = () => {
    const now = ctxRef.current?.currentTime ?? 0;
    for (const voice of voicesRef.current) {
      voice.amp.gain.cancelScheduledValues(now);
      voice.amp.gain.setValueAtTime(Math.max(voice.amp.gain.value, 0.0001), now);
      voice.amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      for (const source of voice.sources) {
        try {
          source.stop(now + 0.05);
        } catch {
          // The note already finished.
        }
      }
    }
    voicesRef.current = [];
    scheduledRef.current.clear();
  };

  const play = async () => {
    const ctx = ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    originRef.current = ctx.currentTime - elapsedRef.current;
    scheduledRef.current.clear();
    runningRef.current = true;
    setRunning(true);
  };

  const pause = () => {
    const ctx = ctxRef.current;
    if (ctx && runningRef.current) elapsedRef.current = ctx.currentTime - originRef.current;
    runningRef.current = false;
    silence();
    setRunning(false);
    void ctx?.suspend();
  };

  const seek = (bar: number) => {
    elapsedRef.current = bar * barSeconds();
    const ctx = ctxRef.current;
    if (ctx && runningRef.current) originRef.current = ctx.currentTime - elapsedRef.current;
    silence();
    setPlayhead({ bar, beat: 0, noteIndex: null, strum: false });
  };

  return (
    <div className="studio">
      <aside className="panel">
        <header className="panel-head">
          <p className="eyebrow">B.B. King · demonstration</p>
          <h1 className="wordmark">
            <a href="/">Wooden Chord</a>
          </h1>
          <p className="lede">
            The Thrill Is Gone, in B minor, as a lesson. A straight-eighth backing — bass, drums,
            electric piano, and strings — sits under the changes. The lower neck keeps the blues
            scale and lights the note that is sounding. Original playing for study, not the recording.
          </p>
          <nav className="view-nav" aria-label="Neck views">
            <a href="/neck">Full neck</a>
            <a href="/focus">Focused neck</a>
            <a href="/thrill" aria-current="page">
              Thrill
            </a>
          </nav>
        </header>

        <section className="control-block">
          <div className="thrill-transport">
            <button type="button" className="thrill-play" onClick={running ? pause : () => void play()}>
              {running ? "Pause" : "Play"}
            </button>
            <p className="thrill-readout">
              <strong>{chord.name}</strong>
              <span>
                {chord.numeral} · bar {playhead.bar + 1} of {BAR_COUNT}
              </span>
            </p>
          </div>
          <div className="bar-strip" role="listbox" aria-label="Chorus bars">
            {FORM.map((entry, index) => (
              <button
                key={`${entry.name}-${index}`}
                type="button"
                role="option"
                aria-selected={index === playhead.bar}
                className={index === playhead.bar ? "is-on" : ""}
                onClick={() => seek(index)}
              >
                <b>{index + 1}</b>
                {entry.name}
              </button>
            ))}
          </div>
          <p className="lesson">{sounding ? sounding.lesson : chord.lesson}</p>
        </section>

        <section className="control-block">
          <h2>B minor blues</h2>
          <p className="scale-notes">{bluesSpelling()}</p>
          <ul className="legend thrill-legend">
            <li>
              <span className="swatch" style={{ background: "#e4b15c" }} />
              Chord tone of this bar
            </li>
            <li>
              <span className="swatch" style={{ background: "#f4efe4" }} />
              Other scale tone
            </li>
            <li>
              <span className="swatch" style={{ background: "#9ec4d8" }} />
              Blue note
            </li>
            <li>
              <span className="swatch" style={{ background: "#e07a45" }} />
              Outside the scale
            </li>
          </ul>
          {sounding ? (
            <p className="hint">
              Sounding {noteName(pitchClass(sounding.string, sounding.fret), "sharp")}
              {sounding.outside ? " · outside the blues scale" : sounding.blue ? " · blue note" : ""}.
            </p>
          ) : running ? (
            <p className="hint">The chorus is playing.</p>
          ) : (
            <p className="hint">Press play. The backing loops at {BPM}, straight eighths, half-time backbeat.</p>
          )}
        </section>
      </aside>

      <main className="stage neck-stage">
        <ThrillScene
          chordName={chord.name}
          chordFrets={chord.frets}
          chordTones={chord.tones}
          lead={
            sounding
              ? {
                  string: sounding.string,
                  fret: sounding.fret,
                  outside: sounding.outside,
                  blue: sounding.blue,
                }
              : null
          }
          strum={playhead.strum}
        />
        <p className="stage-hint">Rhythm on top. The lesson line underneath. Backing follows the bar.</p>
      </main>
    </div>
  );
}

function pluck(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  time: number,
  midi: number,
  duration: number,
  gain: number,
) {
  const osc = ctx.createOscillator();
  const body = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  osc.type = "triangle";
  body.type = "sawtooth";
  osc.frequency.setValueAtTime(frequency(midi), time);
  body.frequency.setValueAtTime(frequency(midi), time);
  body.detune.setValueAtTime(6, time);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2400, time);
  filter.frequency.exponentialRampToValueAtTime(700, time + duration);
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(gain, time + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  osc.connect(filter);
  body.connect(filter);
  filter.connect(amp);
  amp.connect(master);
  const voice: BandVoice = { sources: [osc, body], amp };
  voices.push(voice);
  osc.addEventListener("ended", () => {
    const index = voices.indexOf(voice);
    if (index >= 0) voices.splice(index, 1);
  });
  osc.start(time);
  body.start(time);
  osc.stop(time + duration + 0.05);
  body.stop(time + duration + 0.05);
}
