export type TrackSource = 'curated' | 'youtube' | 'imported' | 'itunes' | 'local';

export type SynthPreset = 'nocturne' | 'horizon' | 'chrome' | 'amber';

export type ImportProvider = 'youtube' | 'youtube-music' | 'spotify';

export type AccentColorPreset = 'rose' | 'blue' | 'emerald' | 'violet' | 'amber' | 'auto';

export type LayoutDensity = 'comfortable' | 'compact';

export type PlayerBarStyle = 'docked' | 'floating';

export type SleepTimerMinutes = 0 | 15 | 30 | 60;

export interface ThemePrefs {
  accentColor: AccentColorPreset;
  glassIntensity: number; // 0 - 100
  ambientGlowEnabled: boolean;
  ambientGlowIntensity: number; // 0 - 100
  layoutDensity: LayoutDensity;
  playerBarStyle: PlayerBarStyle;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUrl?: string;
  audioUrl?: string;
  youtubeVideoId?: string;
  externalUrl?: string;
  importProvider?: ImportProvider;
  source: TrackSource;
  lyrics?: string;
  addedAt: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  synthPreset?: SynthPreset;
  previewNote?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: number;
  isSystem?: boolean;
}

export type HomeWidgetId = 'quick-picks' | 'recently-played' | 'playlists';

export interface HomeWidgetConfig {
  id: HomeWidgetId;
  label: string;
  description: string;
  visible: boolean;
}

export type NavTab = 'home' | 'search' | 'library';

export type RepeatMode = 'off' | 'all' | 'one';

export type NowPlayingTab = 'up-next' | 'lyrics';

export interface PlayerPrefs {
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
}

export interface AppSettings {
  youtubeApiKey: string;
  showCompactVideo: boolean;
}

export interface CachedSearchEntry {
  query: string;
  timestamp: number;
  tracks: Track[];
}

export type AppLanguage = 'tr' | 'en';

export interface CloudUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
}

