import type { AccentColorPreset, AppLanguage, ThemePrefs, Track } from '../types/music';

export interface AmbientPalette {
  primary: string;
  secondary: string;
  accent: string;
  autoAccentKey: Exclude<AccentColorPreset, 'auto'>;
}

export interface AccentPresetDefinition {
  id: AccentColorPreset;
  label: string;
  swatchHex: string;
  shades: {
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
  };
}

export const ACCENT_PRESET_MAP: Record<
  Exclude<AccentColorPreset, 'auto'>,
  AccentPresetDefinition
> = {
  rose: {
    id: 'rose',
    label: 'Apple Rose',
    swatchHex: '#f43f5e',
    shades: {
      200: '#fecdd3',
      300: '#fda4af',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
    },
  },
  blue: {
    id: 'blue',
    label: 'Electric Blue',
    swatchHex: '#3b82f6',
    shades: {
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
    },
  },
  emerald: {
    id: 'emerald',
    label: 'Emerald',
    swatchHex: '#10b981',
    shades: {
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
    },
  },
  violet: {
    id: 'violet',
    label: 'Violet',
    swatchHex: '#8b5cf6',
    shades: {
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
    },
  },
  amber: {
    id: 'amber',
    label: 'Amber',
    swatchHex: '#f59e0b',
    shades: {
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
    },
  },
};

export const ACCENT_COLOR_OPTIONS: {
  id: AccentColorPreset;
  label: string;
  labelTr: string;
  swatchHex: string;
  description: string;
  descriptionTr: string;
}[] = [
  {
    id: 'rose',
    label: 'Apple Rose',
    labelTr: 'Gül Kırmızısı',
    swatchHex: '#f43f5e',
    description: 'Signature crimson-rose glass highlight',
    descriptionTr: 'İmza gül kırmızısı cam vurgusu',
  },
  {
    id: 'blue',
    label: 'Electric Blue',
    labelTr: 'Elektrik Mavi',
    swatchHex: '#3b82f6',
    description: 'Deep cobalt studio monitor glow',
    descriptionTr: 'Derin kobalt stüdyo parıltısı',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    labelTr: 'Zümrüt Yeşili',
    swatchHex: '#10b981',
    description: 'Clean studio green signal accent',
    descriptionTr: 'Canlı stüdyo yeşili vurgu',
  },
  {
    id: 'violet',
    label: 'Violet',
    labelTr: 'Mor',
    swatchHex: '#8b5cf6',
    description: 'Late-night synthwave ultraviolet',
    descriptionTr: 'Gece yarısı ultraviyole tonu',
  },
  {
    id: 'amber',
    label: 'Amber',
    labelTr: 'Kehribar',
    swatchHex: '#f59e0b',
    description: 'Warm analog vacuum-tube gold',
    descriptionTr: 'Sıcak analog altın tonu',
  },
  {
    id: 'auto',
    label: 'Auto from Album Art',
    labelTr: 'Albüm Kapağından Otomatik',
    swatchHex: 'linear-gradient(135deg, #f43f5e 0%, #8b5cf6 50%, #3b82f6 100%)',
    description: 'Dynamically shifts with the active track cover',
    descriptionTr: 'Çalan parçanın kapağına göre dinamik değişir',
  },
];

export function getLocalizedAccentOptions(lang: AppLanguage) {
  return ACCENT_COLOR_OPTIONS.map((opt) => ({
    id: opt.id,
    label: lang === 'tr' ? opt.labelTr : opt.label,
    swatchHex: opt.swatchHex,
    description: lang === 'tr' ? opt.descriptionTr : opt.description,
  }));
}

const PRESET_PALETTES: AmbientPalette[] = [
  {
    // Warm amber & deep indigo prism
    primary: 'rgba(245, 158, 11, 0.28)',
    secondary: 'rgba(99, 102, 241, 0.24)',
    accent: 'rgba(244, 63, 94, 0.2)',
    autoAccentKey: 'amber',
  },
  {
    // Velvet horizon ocean slate & cyan
    primary: 'rgba(56, 189, 248, 0.28)',
    secondary: 'rgba(59, 130, 246, 0.24)',
    accent: 'rgba(129, 140, 248, 0.2)',
    autoAccentKey: 'blue',
  },
  {
    // Chrome echoes silver & emerald mist
    primary: 'rgba(16, 185, 129, 0.26)',
    secondary: 'rgba(45, 212, 191, 0.22)',
    accent: 'rgba(99, 102, 241, 0.18)',
    autoAccentKey: 'emerald',
  },
  {
    // Copper reel rose & warm terracotta
    primary: 'rgba(244, 63, 94, 0.28)',
    secondary: 'rgba(217, 119, 6, 0.22)',
    accent: 'rgba(168, 85, 247, 0.18)',
    autoAccentKey: 'rose',
  },
  {
    // Midnight violet & royal blue
    primary: 'rgba(139, 92, 246, 0.28)',
    secondary: 'rgba(37, 99, 235, 0.24)',
    accent: 'rgba(236, 72, 153, 0.2)',
    autoAccentKey: 'violet',
  },
];

export function getAmbientPaletteForTrack(track: Track | null): AmbientPalette {
  if (!track) return PRESET_PALETTES[3];

  if (track.synthPreset === 'nocturne') return PRESET_PALETTES[3];
  if (track.synthPreset === 'horizon') return PRESET_PALETTES[1];
  if (track.synthPreset === 'chrome') return PRESET_PALETTES[2];
  if (track.synthPreset === 'amber') return PRESET_PALETTES[0];

  const seed = `${track.id}:${track.title}:${track.artist}:${track.coverUrl || ''}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PRESET_PALETTES[hash % PRESET_PALETTES.length];
}

export function resolveEffectiveAccentDefinition(
  accentColor: AccentColorPreset,
  track: Track | null
): AccentPresetDefinition {
  if (accentColor === 'auto') {
    const palette = getAmbientPaletteForTrack(track);
    return ACCENT_PRESET_MAP[palette.autoAccentKey];
  }
  return ACCENT_PRESET_MAP[accentColor] || ACCENT_PRESET_MAP.rose;
}

export function computeThemeCssVariables(
  theme: ThemePrefs,
  track: Track | null
): Record<string, string> {
  const accentDef = resolveEffectiveAccentDefinition(theme.accentColor, track);
  const clampedGlass = Math.min(100, Math.max(0, theme.glassIntensity));
  const clampedGlow = Math.min(100, Math.max(0, theme.ambientGlowIntensity));

  const blurPx = Math.round(8 + (clampedGlass / 100) * 52);
  const blurSubtlePx = Math.round(6 + (clampedGlass / 100) * 36);
  const alphaTop = (0.025 + (clampedGlass / 100) * 0.085).toFixed(3);
  const alphaBottom = (0.01 + (clampedGlass / 100) * 0.045).toFixed(3);
  const borderAlpha = (0.05 + (clampedGlass / 100) * 0.11).toFixed(3);
  const modalAlphaTop = (0.94 + (clampedGlass / 100) * 0.04).toFixed(3);
  const modalAlphaBottom = (0.96 + (clampedGlass / 100) * 0.03).toFixed(3);
  const glowOpacity = theme.ambientGlowEnabled ? (clampedGlow / 100).toFixed(2) : '0';

  return {
    '--color-rose-200': accentDef.shades[200],
    '--color-rose-300': accentDef.shades[300],
    '--color-rose-400': accentDef.shades[400],
    '--color-rose-500': accentDef.shades[500],
    '--color-rose-600': accentDef.shades[600],
    '--cadence-accent': accentDef.shades[500],
    '--cadence-accent-soft': accentDef.shades[400],
    '--glass-blur': `${blurPx}px`,
    '--glass-blur-subtle': `${blurSubtlePx}px`,
    '--glass-alpha-top': alphaTop,
    '--glass-alpha-bottom': alphaBottom,
    '--glass-border-alpha': borderAlpha,
    '--glass-modal-top': modalAlphaTop,
    '--glass-modal-bottom': modalAlphaBottom,
    '--ambient-glow-opacity': glowOpacity,
  };
}
