import { FORM, barSeconds, beatSeconds, frequency, midiNote } from "@/lib/demo/thrill";

export type BandVoice = {
  sources: AudioScheduledSourceNode[];
  amp: GainNode;
};

/** Low roots for an original two-feel bass line. Not the recorded bass part. */
const BASS_ROOT: Record<string, number> = {
  Bm7: 35,
  Em7: 40,
  Gmaj7: 43,
  "F#7": 42,
};

export function makeNoise(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  return buffer;
}

export function playBacking(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  noise: AudioBuffer,
  barStart: number,
  bar: number,
) {
  const chord = FORM[bar];
  const next = FORM[(bar + 1) % FORM.length];
  const root = BASS_ROOT[chord.name];
  const fifth = root + 7;
  const approach = BASS_ROOT[next.name] - 1;
  const beat = beatSeconds();
  const eighth = beat / 2;

  bass(ctx, master, voices, barStart, root, beat * 0.95);
  bass(ctx, master, voices, barStart + eighth, fifth, eighth * 0.85);
  bass(ctx, master, voices, barStart + beat * 2, root, beat * 0.95);
  bass(ctx, master, voices, barStart + beat * 2 + eighth, fifth, eighth * 0.8);
  bass(ctx, master, voices, barStart + beat * 3.5, approach, eighth * 0.95, true);

  kick(ctx, master, voices, barStart);
  kick(ctx, master, voices, barStart + beat * 2, 0.72);
  snare(ctx, master, voices, noise, barStart + beat);
  snare(ctx, master, voices, noise, barStart + beat * 3, 0.8);
  for (let step = 0; step < 4; step += 1) ride(ctx, master, voices, noise, barStart + beat * step);
  for (let step = 1; step < 8; step += 2) hat(ctx, master, voices, noise, barStart + eighth * step);

  pad(ctx, master, voices, barStart, chord.tones, barSeconds() * 0.98);
  stab(ctx, master, voices, barStart + eighth, root + 12);
  stab(ctx, master, voices, barStart + beat * 2 + eighth, fifth + 12);
  piano(ctx, master, voices, barStart, chord.tones, barSeconds() * 0.96);
  chop(ctx, master, voices, barStart, chord.frets);
  chop(ctx, master, voices, barStart + beat * 2, chord.frets, 0.7);
}

function connect(
  master: GainNode,
  voices: BandVoice[],
  sources: AudioScheduledSourceNode[],
  amp: GainNode,
  time: number,
  stopAt: number,
) {
  amp.connect(master);
  const voice: BandVoice = { sources, amp };
  voices.push(voice);
  sources[0].addEventListener("ended", () => {
    const index = voices.indexOf(voice);
    if (index >= 0) voices.splice(index, 1);
  });
  for (const source of sources) {
    source.start(time);
    source.stop(stopAt);
  }
}

function tone(
  ctx: AudioContext,
  type: OscillatorType,
  midi: number,
  time: number,
  slideFrom?: number,
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  const start = frequency(slideFrom ?? midi);
  osc.frequency.setValueAtTime(start, time);
  if (slideFrom !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(frequency(midi), time + Math.min(0.1, 0.08));
  }
  return osc;
}

function envelope(ctx: AudioContext, time: number, attack: number, peak: number, release: number) {
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(peak, time + attack);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + attack + release);
  return amp;
}

function bass(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  time: number,
  midi: number,
  duration: number,
  slide = false,
) {
  const body = tone(ctx, "sine", midi, time, slide ? midi - 1 : undefined);
  const grit = tone(ctx, "triangle", midi, time, slide ? midi - 1 : undefined);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(280, time);
  const amp = envelope(ctx, time, 0.012, 0.2, duration);
  body.connect(filter);
  grit.connect(filter);
  filter.connect(amp);
  connect(master, voices, [body, grit], amp, time, time + duration + 0.06);
}

function kick(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  time: number,
  level = 1,
) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(46, time + 0.09);
  const amp = envelope(ctx, time, 0.004, 0.55 * level, 0.26);
  osc.connect(amp);
  connect(master, voices, [osc], amp, time, time + 0.32);
}

function snare(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  noise: AudioBuffer,
  time: number,
  level = 1,
) {
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noise;
  const body = ctx.createOscillator();
  body.type = "triangle";
  body.frequency.setValueAtTime(190, time);
  body.frequency.exponentialRampToValueAtTime(120, time + 0.08);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.7;
  const amp = envelope(ctx, time, 0.003, 0.16 * level, 0.14);
  noiseSrc.connect(filter);
  body.connect(filter);
  filter.connect(amp);
  connect(master, voices, [noiseSrc, body], amp, time, time + 0.2);
}

function hat(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  noise: AudioBuffer,
  time: number,
) {
  metal(ctx, master, voices, noise, time, 7000, 0.035, 0.045);
}

function ride(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  noise: AudioBuffer,
  time: number,
) {
  metal(ctx, master, voices, noise, time, 4800, 0.16, 0.04);
}

function metal(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  noise: AudioBuffer,
  time: number,
  cutoff: number,
  release: number,
  peak: number,
) {
  const source = ctx.createBufferSource();
  source.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = cutoff;
  const amp = envelope(ctx, time, 0.002, peak, release);
  source.connect(filter);
  filter.connect(amp);
  connect(master, voices, [source], amp, time, time + release + 0.04);
}

function pad(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  time: number,
  tones: readonly number[],
  duration: number,
) {
  const sources: AudioScheduledSourceNode[] = [];
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(700, time);
  filter.frequency.linearRampToValueAtTime(1400, time + 0.6);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(0.02, time + 0.22);
  amp.gain.setValueAtTime(0.016, time + duration * 0.7);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  for (const pitch of tones) {
    const midi = place(pitch, 64, 78);
    for (const detune of [-7, 6]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(frequency(midi), time);
      osc.detune.setValueAtTime(detune, time);
      osc.connect(filter);
      sources.push(osc);
    }
  }
  filter.connect(amp);
  connect(master, voices, sources, amp, time, time + duration + 0.05);
}

function stab(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  time: number,
  midi: number,
) {
  const osc = tone(ctx, "sawtooth", midi, time);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(420, time);
  const amp = envelope(ctx, time, 0.008, 0.09, 0.22);
  osc.connect(filter);
  filter.connect(amp);
  connect(master, voices, [osc], amp, time, time + 0.3);
}

function piano(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  time: number,
  tones: readonly number[],
  duration: number,
) {
  const sources: AudioScheduledSourceNode[] = [];
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, time);
  amp.gain.exponentialRampToValueAtTime(0.035, time + 0.04);
  amp.gain.exponentialRampToValueAtTime(0.012, time + duration * 0.7);
  amp.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  for (const pitch of tones) {
    const midi = place(pitch, 52, 67);
    const sine = tone(ctx, "sine", midi, time);
    const bright = tone(ctx, "triangle", midi, time);
    bright.detune.setValueAtTime(8, time);
    sine.connect(amp);
    bright.connect(amp);
    sources.push(sine, bright);
  }
  connect(master, voices, sources, amp, time, time + duration + 0.05);
}

function chop(
  ctx: AudioContext,
  master: GainNode,
  voices: BandVoice[],
  time: number,
  frets: ReadonlyArray<number | null>,
  level = 1,
) {
  frets.forEach((fret, string) => {
    if (fret === null) return;
    const osc = tone(ctx, "triangle", midiNote(string, fret), time);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1100;
    filter.Q.value = 0.8;
    const amp = envelope(ctx, time + string * 0.012, 0.006, 0.04 * level, 0.16);
    osc.connect(filter);
    filter.connect(amp);
    connect(master, voices, [osc], amp, time + string * 0.012, time + 0.24);
  });
}

function place(pitchClass: number, low: number, high: number): number {
  let midi = 60 + ((pitchClass % 12) + 12) % 12;
  while (midi < low) midi += 12;
  while (midi > high) midi -= 12;
  return midi;
}
