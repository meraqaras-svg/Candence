import type {
  AccentColorPreset,
  AppLanguage,
  AppSettings,
  CachedSearchEntry,
  HomeWidgetConfig,
  OfflineVaultStats,
  PlayerPrefs,
  Playlist,
  ThemePrefs,
  Track,
} from '../types/music';
import { DEFAULT_HOME_LAYOUT, normalizeLayout } from './layoutManager';

export const STORAGE_KEYS = {
  HOME_LAYOUT: 'cadence_home_layout_v1',
  PLAYLISTS: 'cadence_playlists_v1',
  RECENT_IDS: 'cadence_recent_ids_v1',
  FAVORITE_IDS: 'cadence_favorite_ids_v1',
  CUSTOM_LYRICS: 'cadence_custom_lyrics_v1',
  LOCAL_TRACKS: 'cadence_local_tracks_v1',
  SAVED_TRACKS: 'cadence_saved_tracks_v1',
  IMPORTED_TRACKS: 'cadence_imported_tracks_v1',
  PLAYER_PREFS: 'cadence_player_prefs_v1',
  SETTINGS: 'cadence_settings_v1',
  THEME_PREFS: 'cadence_theme_prefs_v1',
  LANGUAGE: 'cadence_language_v1',
  YT_SEARCH_CACHE: 'cadence_yt_search_cache_v1',
} as const;

export const DEFAULT_PLAYER_PREFS: PlayerPrefs = {
  volume: 0.8,
  muted: false,
  shuffle: false,
  repeat: 'off',
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  youtubeApiKey: '',
  showCompactVideo: false,
};

export const DEFAULT_THEME_PREFS: ThemePrefs = {
  accentColor: 'rose',
  glassIntensity: 75,
  ambientGlowEnabled: true,
  ambientGlowIntensity: 80,
  layoutDensity: 'comfortable',
  playerBarStyle: 'docked',
};

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadHomeLayout(): HomeWidgetConfig[] {
  const saved = safeReadJson<unknown>(STORAGE_KEYS.HOME_LAYOUT, null);
  return saved ? normalizeLayout(saved) : DEFAULT_HOME_LAYOUT.map((w) => ({ ...w }));
}

export function saveHomeLayout(layout: HomeWidgetConfig[]): void {
  safeWriteJson(STORAGE_KEYS.HOME_LAYOUT, layout);
}

export function loadPlaylists(fallback: Playlist[]): Playlist[] {
  const saved = safeReadJson<Playlist[] | null>(STORAGE_KEYS.PLAYLISTS, null);
  if (!Array.isArray(saved) || saved.length === 0) return fallback;
  return saved;
}

export function savePlaylists(playlists: Playlist[]): void {
  safeWriteJson(STORAGE_KEYS.PLAYLISTS, playlists);
}

export function loadRecentTrackIds(fallback: string[]): string[] {
  const saved = safeReadJson<string[] | null>(STORAGE_KEYS.RECENT_IDS, null);
  if (!Array.isArray(saved)) return fallback;
  return saved;
}

export function saveRecentTrackIds(ids: string[]): void {
  safeWriteJson(STORAGE_KEYS.RECENT_IDS, ids.slice(0, 24));
}

export function loadFavoriteIds(): string[] {
  const saved = safeReadJson<string[] | null>(STORAGE_KEYS.FAVORITE_IDS, null);
  return Array.isArray(saved) ? saved : [];
}

export function saveFavoriteIds(ids: string[]): void {
  safeWriteJson(STORAGE_KEYS.FAVORITE_IDS, ids);
}

export function loadCustomLyricsMap(): Record<string, string> {
  const saved = safeReadJson<Record<string, string> | null>(STORAGE_KEYS.CUSTOM_LYRICS, null);
  return saved && typeof saved === 'object' ? saved : {};
}

export function saveCustomLyrics(trackId: string, lyrics: string): Record<string, string> {
  const current = loadCustomLyricsMap();
  const next = { ...current, [trackId]: lyrics };
  safeWriteJson(STORAGE_KEYS.CUSTOM_LYRICS, next);
  return next;
}

export function loadSavedExternalTracks(): Track[] {
  const saved = safeReadJson<Track[] | null>(STORAGE_KEYS.SAVED_TRACKS, null);
  return Array.isArray(saved) ? saved : [];
}

export function saveExternalTracks(tracks: Track[]): void {
  safeWriteJson(STORAGE_KEYS.SAVED_TRACKS, tracks.slice(0, 150));
}

export function loadImportedTracks(): Track[] {
  const saved = safeReadJson<Track[] | null>(STORAGE_KEYS.IMPORTED_TRACKS, null);
  return Array.isArray(saved) ? saved : [];
}

export function saveImportedTracks(tracks: Track[]): void {
  safeWriteJson(STORAGE_KEYS.IMPORTED_TRACKS, tracks.slice(0, 100));
}

export function loadLocalTrackMeta(): Track[] {
  const saved = safeReadJson<Track[] | null>(STORAGE_KEYS.LOCAL_TRACKS, null);
  return Array.isArray(saved) ? saved : [];
}

export function saveLocalTrackMeta(tracks: Track[]): void {
  const clean = tracks.map(({ audioUrl: _transient, ...rest }) => rest);
  safeWriteJson(STORAGE_KEYS.LOCAL_TRACKS, clean);
}

export function loadPlayerPrefs(): PlayerPrefs {
  const saved = safeReadJson<Partial<PlayerPrefs> | null>(STORAGE_KEYS.PLAYER_PREFS, null);
  if (!saved || typeof saved !== 'object') return DEFAULT_PLAYER_PREFS;
  return {
    volume: typeof saved.volume === 'number' ? Math.min(1, Math.max(0, saved.volume)) : 0.8,
    muted: Boolean(saved.muted),
    shuffle: Boolean(saved.shuffle),
    repeat: saved.repeat === 'all' || saved.repeat === 'one' ? saved.repeat : 'off',
  };
}

export function savePlayerPrefs(prefs: PlayerPrefs): void {
  safeWriteJson(STORAGE_KEYS.PLAYER_PREFS, prefs);
}

export function loadAppSettings(): AppSettings {
  const saved = safeReadJson<Partial<AppSettings> | null>(STORAGE_KEYS.SETTINGS, null);
  if (!saved || typeof saved !== 'object') return DEFAULT_APP_SETTINGS;
  return {
    youtubeApiKey: typeof saved.youtubeApiKey === 'string' ? saved.youtubeApiKey.trim() : '',
    showCompactVideo: Boolean(saved.showCompactVideo),
  };
}

export function saveAppSettings(settings: AppSettings): void {
  safeWriteJson(STORAGE_KEYS.SETTINGS, {
    youtubeApiKey: settings.youtubeApiKey.trim(),
    showCompactVideo: Boolean(settings.showCompactVideo),
  });
}

const VALID_ACCENTS: AccentColorPreset[] = ['rose', 'blue', 'emerald', 'violet', 'amber', 'auto'];

export function loadThemePrefs(): ThemePrefs {
  const saved = safeReadJson<Partial<ThemePrefs> | null>(STORAGE_KEYS.THEME_PREFS, null);
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_THEME_PREFS };
  return {
    accentColor:
      typeof saved.accentColor === 'string' &&
      VALID_ACCENTS.includes(saved.accentColor as AccentColorPreset)
        ? (saved.accentColor as AccentColorPreset)
        : DEFAULT_THEME_PREFS.accentColor,
    glassIntensity:
      typeof saved.glassIntensity === 'number'
        ? Math.min(100, Math.max(0, Math.round(saved.glassIntensity)))
        : DEFAULT_THEME_PREFS.glassIntensity,
    ambientGlowEnabled:
      typeof saved.ambientGlowEnabled === 'boolean'
        ? saved.ambientGlowEnabled
        : DEFAULT_THEME_PREFS.ambientGlowEnabled,
    ambientGlowIntensity:
      typeof saved.ambientGlowIntensity === 'number'
        ? Math.min(100, Math.max(0, Math.round(saved.ambientGlowIntensity)))
        : DEFAULT_THEME_PREFS.ambientGlowIntensity,
    layoutDensity:
      saved.layoutDensity === 'compact' || saved.layoutDensity === 'comfortable'
        ? saved.layoutDensity
        : DEFAULT_THEME_PREFS.layoutDensity,
    playerBarStyle:
      saved.playerBarStyle === 'floating' || saved.playerBarStyle === 'docked'
        ? saved.playerBarStyle
        : DEFAULT_THEME_PREFS.playerBarStyle,
  };
}

export function saveThemePrefs(prefs: ThemePrefs): void {
  safeWriteJson(STORAGE_KEYS.THEME_PREFS, prefs);
}

export function loadAppLanguage(): AppLanguage {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'tr';
    const raw = window.localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (!raw) return 'tr';
    const parsed = raw.startsWith('"') ? (JSON.parse(raw) as unknown) : raw;
    return parsed === 'en' || parsed === 'tr' ? parsed : 'tr';
  } catch {
    return 'tr';
  }
}

export function saveAppLanguage(language: AppLanguage): void {
  safeWriteJson(STORAGE_KEYS.LANGUAGE, language);
}

// YouTube Search localStorage cache to save quota
export function loadSearchCacheMap(): Record<string, CachedSearchEntry> {
  const saved = safeReadJson<Record<string, CachedSearchEntry> | null>(
    STORAGE_KEYS.YT_SEARCH_CACHE,
    null
  );
  return saved && typeof saved === 'object' ? saved : {};
}

export function getCachedSearchResults(normalizedQuery: string): Track[] | null {
  if (!normalizedQuery) return null;
  const map = loadSearchCacheMap();
  const entry = map[normalizedQuery];
  if (!entry || !Array.isArray(entry.tracks) || entry.tracks.length === 0) {
    return null;
  }
  return entry.tracks;
}

export function setCachedSearchResults(normalizedQuery: string, tracks: Track[]): void {
  if (!normalizedQuery || tracks.length === 0) return;
  const map = loadSearchCacheMap();
  const next: Record<string, CachedSearchEntry> = {
    ...map,
    [normalizedQuery]: {
      query: normalizedQuery,
      timestamp: Date.now(),
      tracks,
    },
  };

  // Cap cache at 40 recent search queries so localStorage stays lean
  const entries = Object.entries(next).sort((a, b) => b[1].timestamp - a[1].timestamp);
  const trimmed = Object.fromEntries(entries.slice(0, 40));
  safeWriteJson(STORAGE_KEYS.YT_SEARCH_CACHE, trimmed);
}

export function clearSearchCache(): void {
  safeWriteJson(STORAGE_KEYS.YT_SEARCH_CACHE, {});
}

// =============================================================================
// NYXON Persistent Offline Audio & Lyrics Vault (IndexedDB)
// Stores local MP3/WAV/OGG audio blobs and cached synced lyrics permanently
// across reloads, while preserving compatibility with existing audio blobs.
// =============================================================================
const VAULT_DB_NAME = 'cadence_local_audio_v1';
const VAULT_DB_VERSION = 2;
const AUDIO_STORE_NAME = 'audio_blobs';
const LYRICS_STORE_NAME = 'lyrics_cache';

export interface CachedLyricsRecord {
  key: string;
  lyrics: string;
  updatedAt: number;
}

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(VAULT_DB_NAME, VAULT_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        db.createObjectStore(AUDIO_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(LYRICS_STORE_NAME)) {
        db.createObjectStore(LYRICS_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storeLocalAudioBlob(trackId: string, blob: Blob): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
      tx.objectStore(AUDIO_STORE_NAME).put(blob, trackId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Fallback gracefully if IndexedDB is blocked
  }
}

export async function loadLocalAudioBlobUrl(trackId: string): Promise<string | undefined> {
  try {
    const db = await openVaultDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE_NAME, 'readonly');
      const req = tx.objectStore(AUDIO_STORE_NAME).get(trackId);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (blob instanceof Blob) {
      return URL.createObjectURL(blob);
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function deleteLocalAudioBlob(trackId: string): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
      tx.objectStore(AUDIO_STORE_NAME).delete(trackId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore cleanup errors
  }
}

export function buildLyricsCacheKey(trackId: string, artist?: string, title?: string): string {
  if (artist && title) {
    return `${artist.trim().toLowerCase()}::${title.trim().toLowerCase()}`;
  }
  return trackId;
}

export async function saveCachedLyricsToDb(key: string, lyrics: string): Promise<void> {
  if (!key || !lyrics.trim()) return;
  try {
    const db = await openVaultDb();
    const record: CachedLyricsRecord = {
      key,
      lyrics,
      updatedAt: Date.now(),
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LYRICS_STORE_NAME, 'readwrite');
      tx.objectStore(LYRICS_STORE_NAME).put(record, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore gracefully when IndexedDB unavailable
  }
}

export async function loadCachedLyricsFromDb(key: string): Promise<string | null> {
  if (!key) return null;
  try {
    const db = await openVaultDb();
    const record = await new Promise<CachedLyricsRecord | string | undefined>((resolve, reject) => {
      const tx = db.transaction(LYRICS_STORE_NAME, 'readonly');
      const req = tx.objectStore(LYRICS_STORE_NAME).get(key);
      req.onsuccess = () => resolve(req.result as CachedLyricsRecord | string | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (typeof record === 'string') return record;
    if (record && typeof record.lyrics === 'string') return record.lyrics;
    return null;
  } catch {
    return null;
  }
}

export async function clearCachedLyricsDb(): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LYRICS_STORE_NAME, 'readwrite');
      tx.objectStore(LYRICS_STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore cleanup errors
  }
}

export async function getOfflineVaultStats(): Promise<OfflineVaultStats> {
  let audioTrackCount = 0;
  let audioBytes = 0;
  let cachedLyricsCount = 0;
  let quotaBytes: number | null = null;
  let usageBytes: number | null = null;

  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction([AUDIO_STORE_NAME, LYRICS_STORE_NAME], 'readonly');
      const audioStore = tx.objectStore(AUDIO_STORE_NAME);
      const lyricsStore = tx.objectStore(LYRICS_STORE_NAME);

      const audioCursorReq = audioStore.openCursor();
      audioCursorReq.onsuccess = () => {
        const cursor = audioCursorReq.result;
        if (cursor) {
          audioTrackCount += 1;
          const val = cursor.value;
          if (val instanceof Blob) {
            audioBytes += val.size;
          }
          cursor.continue();
        }
      };

      const lyricsCountReq = lyricsStore.count();
      lyricsCountReq.onsuccess = () => {
        cachedLyricsCount = lyricsCountReq.result || 0;
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch {
    // Ignore when IndexedDB unavailable
  }

  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.storage &&
      typeof navigator.storage.estimate === 'function'
    ) {
      const estimate = await navigator.storage.estimate();
      if (typeof estimate.quota === 'number') quotaBytes = estimate.quota;
      if (typeof estimate.usage === 'number') usageBytes = estimate.usage;
    }
  } catch {
    // Ignore unsupported estimate API
  }

  return {
    audioTrackCount,
    audioBytes,
    cachedLyricsCount,
    quotaBytes,
    usageBytes,
  };
}
