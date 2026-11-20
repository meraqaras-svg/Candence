import type { UserPlan } from '../types/music';

export const ADMIN_EMAIL = 'meraqaras@gmail.com';
export const AD_TRIGGER_INTERVAL = 3;

export const DEFAULT_AD_SPOT_DURATION_SEC = 9;
export const BUILT_IN_TR_AD_SCRIPT =
  'NYXON Pro ile müziğin keyfini kesintisiz ve reklamsız çıkarın. Şarkınız birkaç saniye içinde başlıyor.';

let cachedAdSpotUrl: string | null = null;

/**
 * Strict case-insensitive check for the sole NYXON Admin email.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

/**
 * Determines whether a user is effectively ad-free (NYXON Pro or Admin).
 */
export function isUserAdFree(plan: UserPlan | undefined, email: string | null | undefined): boolean {
  if (isAdminEmail(email)) return true;
  return plan === 'pro';
}

/**
 * Pure ad trigger rule:
 * - Pro users & Admin NEVER hear ads.
 * - Free users hear an unskippable audio ad every 3 songs (i.e. when songsSinceLastAd >= 3).
 */
export function shouldPlayAudioAd(params: {
  plan?: UserPlan;
  email?: string | null;
  songsSinceLastAd: number;
}): boolean {
  if (isUserAdFree(params.plan, params.email)) return false;
  return params.songsSinceLastAd >= AD_TRIGGER_INTERVAL;
}

/**
 * Normalizes a user-entered promo activation code (uppercase, trimmed, single dashes).
 */
export function normalizePromoCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9-]/g, '');
}

/**
 * Generates a readable 1-time NYXON Pro activation code (e.g. NYXON-7K4M-9P2Q).
 * Omits confusing glyphs (0, O, 1, I).
 */
export function generatePromoCode(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const segment = (len: number) => {
    let out = '';
    for (let i = 0; i < len; i++) {
      const idx =
        typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
          ? crypto.getRandomValues(new Uint32Array(1))[0] % alphabet.length
          : Math.floor(Math.random() * alphabet.length);
      out += alphabet[idx];
    }
    return out;
  };
  return `NYXON-${segment(4)}-${segment(4)}`;
}

function writeAscii(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Generates a crisp, pleasant ~9s crystalline glass chime WAV blob URL for the built-in
 * Turkish NYXON Audio Ad spot so playback ALWAYS progresses smoothly in <audio> even if
 * no custom MP3 URL is configured or SpeechSynthesis is unavailable.
 */
export function generateBuiltInAdSpotWavUrl(durationSec = DEFAULT_AD_SPOT_DURATION_SEC): string {
  if (cachedAdSpotUrl) return cachedAdSpotUrl;

  const sampleRate = 22050;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const dataSize = totalSamples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Subtle modern sonic-logo arpeggio + warm glass pad underneath Turkish voiceover
  const chimeNotes = [
    { start: 0.05, freq: 523.25 }, // C5
    { start: 0.25, freq: 659.25 }, // E5
    { start: 0.45, freq: 783.99 }, // G5
    { start: 0.7, freq: 1046.5 }, // C6
    { start: durationSec - 1.4, freq: 659.25 },
    { start: durationSec - 1.15, freq: 783.99 },
    { start: durationSec - 0.9, freq: 1046.5 },
  ];

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const fadeIn = Math.min(1, t / 0.25);
    const fadeOut = Math.min(1, Math.max(0, (durationSec - t) / 0.6));

    // Soft ambient glass bed
    let sample =
      (Math.sin(2 * Math.PI * 261.63 * t) * 0.08 +
        Math.sin(2 * Math.PI * 329.63 * t) * 0.06 +
        Math.sin(2 * Math.PI * 392.0 * t) * 0.05) *
      fadeIn *
      fadeOut;

    // Crystalline chime pings
    for (const note of chimeNotes) {
      const dt = t - note.start;
      if (dt >= 0 && dt < 1.1) {
        const env = Math.exp(-dt * 4.2) * Math.min(1, dt / 0.015);
        sample += Math.sin(2 * Math.PI * note.freq * dt) * 0.22 * env;
        sample += Math.sin(2 * Math.PI * note.freq * 2 * dt) * 0.05 * env;
      }
    }

    const clamped = Math.max(-0.9, Math.min(0.9, sample));
    view.setInt16(offset, Math.floor(clamped * 32767), true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  cachedAdSpotUrl = URL.createObjectURL(blob);
  return cachedAdSpotUrl;
}

/**
 * Speaks the short built-in Turkish NYXON Pro audio spot if browser speechSynthesis is available.
 * Safe no-op on browsers/environments without speech synthesis.
 */
export function speakTurkishAdSpot(volume = 0.85): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(BUILT_IN_TR_AD_SCRIPT);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.98;
    utterance.pitch = 1.0;
    utterance.volume = Math.max(0.1, Math.min(1, volume));
    const voices = window.speechSynthesis.getVoices?.() || [];
    const trVoice = voices.find((v) => v.lang?.toLowerCase().startsWith('tr'));
    if (trVoice) {
      utterance.voice = trVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speechSynthesis errors; the synthesized WAV audio still plays reliably.
  }
}

export function stopTurkishAdSpotSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore
  }
}
