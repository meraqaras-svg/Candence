export type TrackSource = 'curated' | 'local' | 'youtube' | 'imported' | 'itunes';

export type SynthPreset = 'nocturne' | 'horizon' | 'chrome' | 'amber';

export type ImportProvider = 'youtube' | 'youtube-music' | 'spotify';

export type AppLanguage = 'tr' | 'en';

export type UserPlan = 'free' | 'pro';

export type SleepTimerMinutes = 0 | 15 | 30 | 60;

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  coverUrl?: string;
  audioUrl?: string;
  youtubeVideoId?: string;
  source: TrackSource;
  synthPreset?: SynthPreset;
  localFileSize?: number;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  externalUrl?: string;
  importProvider?: ImportProvider;
  previewNote?: string;
  lyrics?: string;
  addedAt: number;
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

export type RepeatMode = 'off' | 'all' | 'one';

export type NavTab = 'home' | 'search' | 'library';
export type ActiveTab = NavTab;

export type NowPlayingTab = 'up-next' | 'lyrics';

export interface LyricLine {
  time: number | null; // null for unsynced plain lyrics
  text: string;
}

export interface PlayerPrefs {
  volume: number; // 0..1
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
}

export type PlayerPreferences = PlayerPrefs;

export interface AppSettings {
  youtubeApiKey: string;
  showCompactVideo: boolean;
}

export type AccentColorPreset = 'rose' | 'blue' | 'emerald' | 'violet' | 'amber' | 'auto';

export type LayoutDensity = 'comfortable' | 'compact';

export type PlayerBarStyle = 'docked' | 'floating';

export interface ThemePrefs {
  accentColor: AccentColorPreset;
  glassIntensity: number; // 0..100
  ambientGlowEnabled: boolean;
  ambientGlowIntensity: number; // 0..100
  layoutDensity: LayoutDensity;
  playerBarStyle: PlayerBarStyle;
}

export interface CloudUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  emailVerified?: boolean;
  plan?: UserPlan;
}

export interface AdminUserRecord {
  uid: string;
  email: string;
  displayName: string;
  plan: UserPlan;
  updatedAt: number;
}

export interface PromoCodeRecord {
  code: string;
  used: boolean;
  createdAt: number;
  createdBy: string;
  usedByUid?: string;
  usedByEmail?: string;
  usedAt?: number;
}

export interface PaymentAdConfig {
  checkoutUrl: string;
  customAdAudioUrl: string;
  updatedAt: number;
}

export interface ActiveAdState {
  active: boolean;
  title: string;
  subtitle: string;
  remainingSec: number;
  durationSec: number;
  currentTimeSec: number;
  isCustomAudio: boolean;
}

export interface OfflineVaultStats {
  audioTrackCount: number;
  audioBytes: number;
  cachedLyricsCount: number;
  quotaBytes: number | null;
  usageBytes: number | null;
}

export interface CachedSearchEntry {
  query: string;
  tracks: Track[];
  timestamp: number;
}
