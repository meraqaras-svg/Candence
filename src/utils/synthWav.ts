import type { SynthPreset } from '../types/music';

const wavCache = new Map<string, string>();

const PRESET_CHORDS: Record<SynthPreset, number[][]> = {
  nocturne: [
    [220.0, 261.63, 329.63, 392.0], // Am7
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [196.0, 246.94, 293.66, 392.0], // G6
    [164.81, 196.0, 246.94, 293.66], // Em7
  ],
  horizon: [
    [196.0, 246.94, 293.66, 369.99], // Gmaj7
    [164.81, 196.0, 246.94, 329.63], // Em7
    [130.81, 164.81, 196.0, 246.94], // Cmaj7
    [146.83, 185.0, 220.0, 293.66], // D6
  ],
  chrome: [
    [146.83, 174.61, 220.0, 261.63], // Dm7
    [233.08, 293.66, 349.23, 440.0], // Bbmaj7
    [196.0, 233.08, 293.66, 349.23], // Gm7
    [220.0, 277.18, 329.63, 392.0], // A7
  ],
  amber: [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [220.0, 261.63, 329.63, 392.0], // Am7
    [174.61, 220.0, 261.63, 349.23], // Fmaj7
    [196.0, 246.94, 293.66, 349.23], // G7sus4
  ],
};

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function generateHarmonicWavUrl(preset: SynthPreset, durationSec = 24): string {
  const key = `${preset}:${durationSec}`;
  const cached = wavCache.get(key);
  if (cached) return cached;

  const sampleRate = 22050;
  const numChannels = 1;
  const bitsPerSample = 16;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const dataSize = totalSamples * numChannels * (bitsPerSample / 8);

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const chords = PRESET_CHORDS[preset];
  const chordDuration = durationSec / chords.length;

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.min(chords.length - 1, Math.floor(t / chordDuration));
    const localT = t - chordIdx * chordDuration;
    const chord = chords[chordIdx];

    // Smooth envelope per chord + overall fade in/out
    const attack = Math.min(1, localT / 0.35);
    const release = Math.min(1, Math.max(0, (chordDuration - localT) / 0.45));
    const globalFadeIn = Math.min(1, t / 0.4);
    const globalFadeOut = Math.min(1, Math.max(0, (durationSec - t) / 0.8));
    const env = attack * release * globalFadeIn * globalFadeOut;

    // Gentle pulse rhythm
    const lfo = 0.78 + 0.22 * Math.sin(2 * Math.PI * 0.5 * t);

    let sample = 0;
    for (let n = 0; n < chord.length; n++) {
      const freq = chord[n];
      // Fundamental + soft octave shimmer
      sample += Math.sin(2 * Math.PI * freq * t) * 0.22;
      sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.04;
    }

    // Gentle bass root
    sample += Math.sin(2 * Math.PI * (chord[0] * 0.5) * t) * 0.25;

    const mixed = Math.max(-0.95, Math.min(0.95, sample * env * lfo * 0.65));
    view.setInt16(offset, Math.floor(mixed * 32767), true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  wavCache.set(key, url);
  return url;
}
