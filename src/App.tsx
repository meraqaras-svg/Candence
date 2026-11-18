import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AudioLines, Cloud, LogIn, Palette, Settings, Upload } from 'lucide-react';
import type {
  AppLanguage,
  AppSettings,
  CloudUserProfile,
  HomeWidgetConfig,
  NavTab,
  NowPlayingTab,
  PlayerPrefs,
  Playlist,
  SleepTimerMinutes,
  ThemePrefs,
  Track,
} from './types/music';
import { DEFAULT_RECENT_IDS, SEED_PLAYLISTS, SEED_TRACKS } from './data/seedLibrary';
import {
  BUILT_IN_YOUTUBE_CATALOG,
  sanitizeFullLengthTracks,
} from './utils/youtubeAndOembed';
import {
  computeThemeCssVariables,
  getAmbientPaletteForTrack,
} from './utils/ambientColor';
import { parseLocalFilename } from './utils/formatters';
import { generateHarmonicWavUrl } from './utils/synthWav';
import {
  DEFAULT_THEME_PREFS,
  clearSearchCache,
  deleteLocalAudioBlob,
  loadAppSettings,
  loadCustomLyricsMap,
  loadFavoriteIds,
  loadHomeLayout,
  loadImportedTracks,
  loadLocalAudioBlobUrl,
  loadLocalTrackMeta,
  loadPlayerPrefs,
  loadPlaylists,
  loadRecentTrackIds,
  loadSavedExternalTracks,
  loadSearchCacheMap,
  loadThemePrefs,
  saveAppSettings,
  saveCustomLyrics,
  saveExternalTracks,
  saveFavoriteIds,
  saveHomeLayout,
  saveImportedTracks,
  saveLocalTrackMeta,
  savePlayerPrefs,
  savePlaylists,
  saveRecentTrackIds,
  saveThemePrefs,
  storeLocalAudioBlob,
} from './utils/storage';
import {
  mapFirebaseAuthError,
  mapFirestoreError,
  refreshCurrentUser,
  resendVerificationEmail,
  saveUserCloudSync,
  signInWithGoogle,
  signOutFromCloud,
  subscribeToAuthState,
  subscribeToUserCloudSync,
} from './utils/firebaseSync';
import { getTranslations } from './utils/i18n';
import { useI18n } from './utils/I18nContext';
import {
  registerMediaSessionHandlers,
  updateMediaSessionMetadata,
} from './utils/mediaSession';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { LibraryView, type LibrarySubTab } from './components/LibraryView';
import { PlayerBar } from './components/PlayerBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstallButton } from './components/PWAInstallButton';
import { NowPlayingOverlay } from './components/NowPlayingOverlay';
import { PlaylistModal } from './components/PlaylistModal';
import { SettingsModal, type SettingsModalTab } from './components/SettingsModal';
import { LinkImportModal } from './components/LinkImportModal';
import { YouTubePlayerBridge } from './components/YouTubePlayerBridge';
import { AuthGate } from './components/AuthGate';

function readAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const cleanup = () => {
      audio.removeAttribute('src');
      audio.load();
    };
    const timer = window.setTimeout(() => {
      cleanup();
      resolve(0);
    }, 3000);

    audio.addEventListener(
      'loadedmetadata',
      () => {
        window.clearTimeout(timer);
        const dur = Number.isFinite(audio.duration) ? audio.duration : 0;
        cleanup();
        resolve(dur);
      },
      { once: true }
    );
    audio.addEventListener(
      'error',
      () => {
        window.clearTimeout(timer);
        cleanup();
        resolve(0);
      },
      { once: true }
    );
    audio.src = url;
  });
}

export default function App() {
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [libraryInitialSubTab, setLibraryInitialSubTab] =
    useState<LibrarySubTab>('playlists');

  // Persisted library, settings, theme & layout state
  const [homeLayout, setHomeLayout] = useState<HomeWidgetConfig[]>(() => loadHomeLayout());
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadPlaylists(SEED_PLAYLISTS));
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    loadRecentTrackIds(DEFAULT_RECENT_IDS)
  );
  const [favoriteIdsList, setFavoriteIdsList] = useState<string[]>(() => loadFavoriteIds());
  const [customLyricsMap, setCustomLyricsMap] = useState<Record<string, string>>(() =>
    loadCustomLyricsMap()
  );
  const [externalTracks, setExternalTracks] = useState<Track[]>(() =>
    sanitizeFullLengthTracks(loadSavedExternalTracks())
  );
  const [importedTracks, setImportedTracks] = useState<Track[]>(() =>
    sanitizeFullLengthTracks(loadImportedTracks())
  );
  const [localTracks, setLocalTracks] = useState<Track[]>(() => loadLocalTrackMeta());
  const [playerPrefs, setPlayerPrefs] = useState<PlayerPrefs>(() => loadPlayerPrefs());
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadAppSettings());
  const [themePrefs, setThemePrefs] = useState<ThemePrefs>(() => loadThemePrefs());
  const [cachedQueryCount, setCachedQueryCount] = useState<number>(
    () => Object.keys(loadSearchCacheMap()).length
  );

  // Firebase Auth & Cloud Sync state
  const [cloudUser, setCloudUser] = useState<CloudUserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isApplyingRemoteRef = useRef(false);

  // Playback state
  const [queue, setQueue] = useState<Track[]>(SEED_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(SEED_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(SEED_TRACKS[0]?.duration || 0);
  const [ytSeekRequest, setYtSeekRequest] = useState<{ time: number; nonce: number } | null>(
    null
  );
  const [ytFallbackMode, setYtFallbackMode] = useState(false);

  // Sleep Timer state (0 = Off, 15m, 30m, 60m)
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<SleepTimerMinutes>(0);
  const [sleepRemainingSec, setSleepRemainingSec] = useState<number | null>(null);

  // Overlays & modals
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [nowPlayingTab, setNowPlayingTab] = useState<NowPlayingTab>('up-next');
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [playlistSeedTrack, setPlaylistSeedTrack] = useState<Track | null>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsModalTab, setSettingsModalTab] = useState<SettingsModalTab>('theme');
  const [linkImportModalOpen, setLinkImportModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const pendingAutoplayRef = useRef(false);

  // Compute and apply dynamic CSS variables for Theme & UI Customizer
  const themeCssVars = useMemo(
    () => computeThemeCssVariables(themePrefs, currentTrack),
    [themePrefs, currentTrack]
  );

  useEffect(() => {
    const root = document.documentElement;
    for (const [prop, val] of Object.entries(themeCssVars)) {
      root.style.setProperty(prop, val);
    }
    root.dataset.density = themePrefs.layoutDensity;
    root.dataset.playerStyle = themePrefs.playerBarStyle;
    root.dataset.accent = themePrefs.accentColor;
  }, [themeCssVars, themePrefs]);

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
    }, 3200);
  }, []);

  const refreshCacheCount = useCallback(() => {
    setCachedQueryCount(Object.keys(loadSearchCacheMap()).length);
  }, []);

  const openSettingsWithTab = useCallback((tab: SettingsModalTab) => {
    setSettingsModalTab(tab);
    setSettingsModalOpen(true);
  }, []);

  // Subscribe to Firebase Auth state (mandatory login gate enforces authentication)
  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      setCloudUser(user);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to Firestore Cloud Sync when signed in
  const latestLocalSyncRef = useRef({
    playlists,
    favoriteIds: favoriteIdsList,
    themePrefs,
    homeLayout,
    savedTracks: [...importedTracks, ...externalTracks],
  });
  useEffect(() => {
    latestLocalSyncRef.current = {
      playlists,
      favoriteIds: favoriteIdsList,
      themePrefs,
      homeLayout,
      savedTracks: [...importedTracks, ...externalTracks],
    };
  }, [playlists, favoriteIdsList, themePrefs, homeLayout, importedTracks, externalTracks]);

  const lastSyncErrorRef = useRef<string | null>(null);

  const handleCloudSyncError = useCallback(
    (err: unknown) => {
      const msg = mapFirestoreError(err, language);
      if (lastSyncErrorRef.current !== msg) {
        lastSyncErrorRef.current = msg;
        showNotice(msg);
      }
    },
    [language, showNotice]
  );

  useEffect(() => {
    if (!cloudUser?.uid) {
      lastSyncErrorRef.current = null;
      return;
    }
    const unsub = subscribeToUserCloudSync(
      cloudUser.uid,
      (remote) => {
        lastSyncErrorRef.current = null;
        isApplyingRemoteRef.current = true;
        if (remote.playlists.length > 0) {
          setPlaylists(remote.playlists);
          savePlaylists(remote.playlists);
        }
        setFavoriteIdsList(remote.favoriteIds);
        saveFavoriteIds(remote.favoriteIds);
        setThemePrefs(remote.themePrefs);
        saveThemePrefs(remote.themePrefs);
        setHomeLayout(remote.homeLayout);
        saveHomeLayout(remote.homeLayout);
        if (remote.savedTracks.length > 0) {
          setExternalTracks(remote.savedTracks);
          saveExternalTracks(remote.savedTracks);
        }
        window.setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 120);
      },
      () => {
        // Initialize cloud document with current local state on first sign-in
        void saveUserCloudSync(
          cloudUser.uid,
          latestLocalSyncRef.current,
          handleCloudSyncError
        );
      },
      handleCloudSyncError
    );
    return () => unsub();
  }, [cloudUser?.uid, handleCloudSyncError]);

  // Push local changes to Firestore when signed in
  useEffect(() => {
    if (!cloudUser?.uid || isApplyingRemoteRef.current) return;
    const timer = window.setTimeout(() => {
      void saveUserCloudSync(
        cloudUser.uid,
        {
          playlists,
          favoriteIds: favoriteIdsList,
          themePrefs,
          homeLayout,
          savedTracks: [...importedTracks, ...externalTracks],
        },
        handleCloudSyncError
      );
    }, 450);
    return () => window.clearTimeout(timer);
  }, [
    cloudUser?.uid,
    playlists,
    favoriteIdsList,
    themePrefs,
    homeLayout,
    importedTracks,
    externalTracks,
    handleCloudSyncError,
  ]);

  const handleSignInGoogle = useCallback(async () => {
    setIsSigningIn(true);
    try {
      const profile = await signInWithGoogle();
      showNotice(t.noticeSignedInAs(profile.displayName || profile.email || 'Google'));
    } catch (err) {
      const message = (err as Error)?.message || '';
      if (!message.includes('popup-closed-by-user')) {
        showNotice(mapFirebaseAuthError(err, language));
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [language, showNotice, t]);

  const handleSignOutCloud = useCallback(async () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setNowPlayingOpen(false);
    setSettingsModalOpen(false);
    setPlaylistModalOpen(false);
    setLinkImportModalOpen(false);
    await signOutFromCloud();
    setCloudUser(null);
    showNotice(t.noticeSignedOut);
  }, [showNotice, t]);

  const handleResendVerification = useCallback(async () => {
    try {
      await resendVerificationEmail();
      showNotice(t.settingsVerificationSent);
    } catch (err) {
      showNotice(mapFirebaseAuthError(err, language));
    }
  }, [language, showNotice, t]);

  const handleRefreshVerification = useCallback(async () => {
    try {
      const updated = await refreshCurrentUser();
      if (updated) {
        setCloudUser(updated);
        if (updated.emailVerified) {
          showNotice(t.settingsCloudAccountActive);
        }
      }
    } catch (err) {
      showNotice(mapFirebaseAuthError(err, language));
    }
  }, [language, showNotice, t]);

  // Hydrate persisted local audio blobs from IndexedDB on startup
  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const savedMeta = loadLocalTrackMeta();
      if (savedMeta.length === 0) return;

      const hydrated = await Promise.all(
        savedMeta.map(async (track) => {
          const url = await loadLocalAudioBlobUrl(track.id);
          return url ? { ...track, audioUrl: url } : track;
        })
      );
      if (active) {
        setLocalTracks(hydrated);
      }
    };
    hydrate();
    return () => {
      active = false;
    };
  }, []);

  // Lookup map across all tracks
  const allTracksMap = useMemo(() => {
    const map = new Map<string, Track>();
    for (const t of SEED_TRACKS) map.set(t.id, t);
    for (const t of BUILT_IN_YOUTUBE_CATALOG) map.set(t.id, t);
    for (const t of externalTracks) map.set(t.id, t);
    for (const t of importedTracks) map.set(t.id, t);
    for (const t of localTracks) map.set(t.id, t);
    return map;
  }, [externalTracks, importedTracks, localTracks]);

  const favoriteIds = useMemo(() => new Set(favoriteIdsList), [favoriteIdsList]);

  const recentTracks = useMemo(
    () =>
      recentIds
        .map((id) => allTracksMap.get(id))
        .filter((t): t is Track => Boolean(t)),
    [recentIds, allTracksMap]
  );

  const favoriteTracks = useMemo(
    () =>
      favoriteIdsList
        .map((id) => allTracksMap.get(id))
        .filter((t): t is Track => Boolean(t)),
    [favoriteIdsList, allTracksMap]
  );

  const localAndCuratedTracks = useMemo(
    () => [...importedTracks, ...localTracks, ...SEED_TRACKS],
    [importedTracks, localTracks]
  );

  const cacheExternalTracks = useCallback((incoming: Track[]) => {
    if (incoming.length === 0) return;
    const sanitized = sanitizeFullLengthTracks(incoming);
    setExternalTracks((prev) => {
      const byId = new Map<string, Track>();
      for (const t of sanitized) byId.set(t.id, t);
      for (const t of prev) {
        if (!byId.has(t.id)) byId.set(t.id, t);
      }
      const next = Array.from(byId.values()).slice(0, 150);
      saveExternalTracks(next);
      return next;
    });
  }, []);

  // Strictly local audio blob URL or offline synthesizer fallback (never 30s iTunes previews)
  const resolvePlayableAudioUrl = useCallback((track: Track): string | undefined => {
    if (track.source === 'local') return track.audioUrl;
    const preset = track.synthPreset || 'nocturne';
    return generateHarmonicWavUrl(preset, 28);
  }, []);

  // Determine whether currentTrack should play via YouTube IFrame Player API
  const isUsingYouTubeIframe = Boolean(
    currentTrack?.youtubeVideoId && !ytFallbackMode
  );

  // Sync HTML5 audio element when playing local files or offline fallback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isUsingYouTubeIframe) {
      audio.pause();
      setCurrentTime(0);
      setDuration(currentTrack.duration || 215);
      if (pendingAutoplayRef.current) {
        pendingAutoplayRef.current = false;
        setIsPlaying(true);
      }
      return;
    }

    const url = resolvePlayableAudioUrl(currentTrack);
    if (!url) {
      setIsPlaying(false);
      return;
    }

    if (audio.src !== url) {
      audio.src = url;
      audio.load();
      setCurrentTime(0);
      setDuration(currentTrack.duration || 215);
    }

    if (pendingAutoplayRef.current) {
      pendingAutoplayRef.current = false;
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentTrack, isUsingYouTubeIframe, resolvePlayableAudioUrl]);

  // Keep HTML5 audio volume & mute synced
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = playerPrefs.muted ? 0 : playerPrefs.volume;
    audio.muted = playerPrefs.muted;
  }, [playerPrefs.volume, playerPrefs.muted]);

  const recordRecent = useCallback(
    (track: Track) => {
      if (track.source === 'itunes' || track.source === 'youtube' || track.source === 'imported') {
        cacheExternalTracks([track]);
      }
      setRecentIds((prev) => {
        const next = [track.id, ...prev.filter((id) => id !== track.id)].slice(0, 20);
        saveRecentTrackIds(next);
        return next;
      });
    },
    [cacheExternalTracks]
  );

  const playTrack = useCallback(
    (track: Track, queueList?: Track[]) => {
      const audio = audioRef.current;

      if (currentTrack?.id === track.id) {
        if (isPlaying) {
          audio?.pause();
          setIsPlaying(false);
        } else {
          if (track.youtubeVideoId && !ytFallbackMode) {
            setIsPlaying(true);
            return;
          }
          const url = resolvePlayableAudioUrl(track);
          if (!url || !audio) {
            showNotice(t.noticeReuploadLocal);
            return;
          }
          if (!audio.src) {
            audio.src = url;
            audio.load();
          }
          audio
            .play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
        return;
      }

      if (queueList && queueList.length > 0) {
        setQueue(queueList);
      } else {
        setQueue((prev) => (prev.some((t) => t.id === track.id) ? prev : [track, ...prev]));
      }

      setYtFallbackMode(false);
      pendingAutoplayRef.current = true;
      setCurrentTrack(track);
      recordRecent(track);
    },
    [currentTrack?.id, isPlaying, recordRecent, resolvePlayableAudioUrl, showNotice, t, ytFallbackMode]
  );

  const handleTogglePlay = useCallback(() => {
    if (!currentTrack) return;

    if (isUsingYouTubeIframe) {
      setIsPlaying((prev) => !prev);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const url = resolvePlayableAudioUrl(currentTrack);
      if (!url) {
        showNotice(t.noticeReuploadLocal);
        return;
      }
      if (!audio.src) {
        audio.src = url;
        audio.load();
      }
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [currentTrack, isPlaying, isUsingYouTubeIframe, resolvePlayableAudioUrl, showNotice, t]);

  const handleNext = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;

    if (playerPrefs.shuffle && queue.length > 1) {
      const candidates = queue.filter((t) => t.id !== currentTrack.id);
      const nextTrack = candidates[Math.floor(Math.random() * candidates.length)];
      if (nextTrack) {
        setYtFallbackMode(false);
        pendingAutoplayRef.current = true;
        setCurrentTrack(nextTrack);
        recordRecent(nextTrack);
      }
      return;
    }

    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx === -1) {
      setYtFallbackMode(false);
      pendingAutoplayRef.current = true;
      setCurrentTrack(queue[0]);
      recordRecent(queue[0]);
      return;
    }

    if (idx + 1 < queue.length) {
      const nextTrack = queue[idx + 1];
      setYtFallbackMode(false);
      pendingAutoplayRef.current = true;
      setCurrentTrack(nextTrack);
      recordRecent(nextTrack);
    } else if (playerPrefs.repeat === 'all') {
      const nextTrack = queue[0];
      setYtFallbackMode(false);
      pendingAutoplayRef.current = true;
      setCurrentTrack(nextTrack);
      recordRecent(nextTrack);
    } else {
      setIsPlaying(false);
    }
  }, [currentTrack, queue, playerPrefs.shuffle, playerPrefs.repeat, recordRecent]);

  const handlePrev = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;

    if (currentTime > 3) {
      if (isUsingYouTubeIframe) {
        setYtSeekRequest({ time: 0, nonce: Date.now() });
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      setCurrentTime(0);
      return;
    }

    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = idx > 0 ? idx - 1 : queue.length - 1;
    const prevTrack = queue[prevIdx];
    if (prevTrack) {
      setYtFallbackMode(false);
      pendingAutoplayRef.current = true;
      setCurrentTrack(prevTrack);
      recordRecent(prevTrack);
    }
  }, [currentTrack, queue, currentTime, isUsingYouTubeIframe, recordRecent]);

  const handleSeek = useCallback(
    (time: number) => {
      setCurrentTime(time);
      if (isUsingYouTubeIframe) {
        setYtSeekRequest({ time, nonce: Date.now() });
      } else if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
    },
    [isUsingYouTubeIframe]
  );

  // Sleep Timer countdown
  const handleSelectSleepTimer = useCallback(
    (minutes: SleepTimerMinutes) => {
      setSleepTimerMinutes(minutes);
      if (minutes === 0) {
        setSleepRemainingSec(null);
        showNotice(t.noticeSleepOff);
      } else {
        setSleepRemainingSec(minutes * 60);
        showNotice(t.noticeSleepSet(minutes));
      }
    },
    [showNotice, t]
  );

  useEffect(() => {
    if (sleepTimerMinutes === 0 || sleepRemainingSec === null) return;
    const interval = window.setInterval(() => {
      setSleepRemainingSec((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          audioRef.current?.pause();
          setIsPlaying(false);
          setSleepTimerMinutes(0);
          showNotice(t.noticeSleepEnded);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sleepTimerMinutes, sleepRemainingSec, showNotice, t]);

  // Media Session API for Android lock screen & notification shade controls
  useEffect(() => {
    updateMediaSessionMetadata(currentTrack, isPlaying, currentTime, duration);
  }, [currentTrack, isPlaying, currentTime, duration]);

  useEffect(() => {
    return registerMediaSessionHandlers({
      onPlay: () => {
        if (!isPlaying) handleTogglePlay();
      },
      onPause: () => {
        if (isPlaying) handleTogglePlay();
      },
      onPreviousTrack: handlePrev,
      onNextTrack: handleNext,
      onSeekTo: handleSeek,
    });
  }, [isPlaying, handleTogglePlay, handlePrev, handleNext, handleSeek]);

  const updatePrefs = useCallback((updater: (prev: PlayerPrefs) => PlayerPrefs) => {
    setPlayerPrefs((prev) => {
      const next = updater(prev);
      savePlayerPrefs(next);
      return next;
    });
  }, []);

  const handleSaveSettings = useCallback(
    (nextSettings: AppSettings) => {
      setAppSettings(nextSettings);
      saveAppSettings(nextSettings);
      showNotice(t.noticeSettingsSaved);
    },
    [showNotice, t]
  );

  const handleUpdateThemePrefs = useCallback((nextTheme: ThemePrefs) => {
    setThemePrefs(nextTheme);
    saveThemePrefs(nextTheme);
  }, []);

  const handleResetThemePrefs = useCallback(() => {
    const reset = { ...DEFAULT_THEME_PREFS };
    setThemePrefs(reset);
    saveThemePrefs(reset);
    showNotice(t.noticeThemeReset);
  }, [showNotice, t]);

  const handleClearSearchCache = useCallback(() => {
    clearSearchCache();
    setCachedQueryCount(0);
    showNotice(t.noticeCacheCleared);
  }, [showNotice, t]);

  const handleImportAndPlay = useCallback(
    (track: Track) => {
      const [cleanTrack] = sanitizeFullLengthTracks([track]);
      setImportedTracks((prev) => {
        const next = [cleanTrack, ...prev.filter((t) => t.id !== cleanTrack.id)].slice(0, 100);
        saveImportedTracks(next);
        return next;
      });
      cacheExternalTracks([cleanTrack]);
      playTrack(cleanTrack);
      showNotice(t.noticeImportedPlaying(cleanTrack.title));
    },
    [cacheExternalTracks, playTrack, showNotice, t]
  );

  const handleImportPlaylist = useCallback(
    (name: string, tracks: Track[], coverUrl?: string) => {
      if (tracks.length === 0) return;
      const sanitizedTracks = sanitizeFullLengthTracks(tracks);

      cacheExternalTracks(sanitizedTracks);
      setImportedTracks((prev) => {
        const byId = new Map<string, Track>();
        for (const t of sanitizedTracks) byId.set(t.id, t);
        for (const t of prev) {
          if (!byId.has(t.id)) byId.set(t.id, t);
        }
        const next = Array.from(byId.values()).slice(0, 100);
        saveImportedTracks(next);
        return next;
      });

      const newPl: Playlist = {
        id: `pl-${Date.now()}`,
        name: name.trim() || t.importPlaylistNamePlaceholder,
        description: t.songsCount(sanitizedTracks.length),
        coverUrl: coverUrl || sanitizedTracks.find((t) => Boolean(t.coverUrl))?.coverUrl,
        trackIds: sanitizedTracks.map((t) => t.id),
        createdAt: Date.now(),
      };

      setPlaylists((prev) => {
        const next = [newPl, ...prev];
        savePlaylists(next);
        return next;
      });

      setSelectedPlaylistId(newPl.id);
      setActiveTab('library');
      if (sanitizedTracks[0]) {
        playTrack(sanitizedTracks[0], sanitizedTracks);
      }
      refreshCacheCount();
      showNotice(t.noticeImportedPlaylist(newPl.name, sanitizedTracks.length));
    },
    [cacheExternalTracks, playTrack, refreshCacheCount, showNotice, t]
  );

  const handleToggleFavorite = useCallback((trackId: string) => {
    setFavoriteIdsList((prev) => {
      const exists = prev.includes(trackId);
      const next = exists ? prev.filter((id) => id !== trackId) : [trackId, ...prev];
      saveFavoriteIds(next);
      return next;
    });
  }, []);

  const handleSaveHomeLayout = useCallback(
    (nextLayout: HomeWidgetConfig[]) => {
      setHomeLayout(nextLayout);
      saveHomeLayout(nextLayout);
      showNotice(t.noticeLayoutSaved);
    },
    [showNotice, t]
  );

  const handleCreatePlaylist = useCallback(
    (name: string, description: string) => {
      const newPl: Playlist = {
        id: `pl-${Date.now()}`,
        name,
        description,
        coverUrl: playlistSeedTrack?.coverUrl,
        trackIds: playlistSeedTrack ? [playlistSeedTrack.id] : [],
        createdAt: Date.now(),
      };
      if (playlistSeedTrack) {
        cacheExternalTracks([playlistSeedTrack]);
      }
      setPlaylists((prev) => {
        const next = [newPl, ...prev];
        savePlaylists(next);
        return next;
      });
      setPlaylistSeedTrack(null);
      showNotice(t.noticePlaylistCreated(name));
    },
    [playlistSeedTrack, cacheExternalTracks, showNotice, t]
  );

  const handleDeletePlaylist = useCallback(
    (playlistId: string) => {
      setPlaylists((prev) => {
        const next = prev.filter((p) => p.id !== playlistId);
        savePlaylists(next);
        return next;
      });
      showNotice(t.noticePlaylistDeleted);
    },
    [showNotice, t]
  );

  const handleAddToPlaylist = useCallback(
    (playlistId: string, track: Track) => {
      cacheExternalTracks([track]);
      setPlaylists((prev) => {
        const next = prev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          if (pl.trackIds.includes(track.id)) return pl;
          return {
            ...pl,
            coverUrl: pl.coverUrl || track.coverUrl,
            trackIds: [...pl.trackIds, track.id],
          };
        });
        savePlaylists(next);
        return next;
      });
      const plName = playlists.find((p) => p.id === playlistId)?.name || t.libraryPlaylistLabel;
      showNotice(t.noticeAddedToPlaylist(track.title, plName));
    },
    [cacheExternalTracks, playlists, showNotice, t]
  );

  const handleRemoveTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) => {
      const next = prev.map((pl) =>
        pl.id === playlistId
          ? { ...pl, trackIds: pl.trackIds.filter((id) => id !== trackId) }
          : pl
      );
      savePlaylists(next);
      return next;
    });
  }, []);

  const handleAddToQueue = useCallback(
    (track: Track) => {
      cacheExternalTracks([track]);
      setQueue((prev) => (prev.some((t) => t.id === track.id) ? prev : [...prev, track]));
      showNotice(t.noticeAddedToQueue(track.title));
    },
    [cacheExternalTracks, showNotice, t]
  );

  const handleRemoveFromQueue = useCallback((trackId: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== trackId));
  }, []);

  const handleOpenLyrics = useCallback(
    (track: Track) => {
      if (currentTrack?.id !== track.id) {
        playTrack(track);
      }
      setNowPlayingTab('lyrics');
      setNowPlayingOpen(true);
    },
    [currentTrack?.id, playTrack]
  );

  const handleSaveCustomLyrics = useCallback(
    (trackId: string, lyrics: string) => {
      const updated = saveCustomLyrics(trackId, lyrics);
      setCustomLyricsMap(updated);
      showNotice(t.noticeLyricsSaved);
    },
    [showNotice, t]
  );

  const handleUploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter(
        (f) =>
          f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f.name)
      );

      if (files.length === 0) {
        showNotice(t.noticeInvalidAudioFiles);
        return;
      }

      const created: Track[] = [];
      for (const file of files) {
        const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const blobUrl = URL.createObjectURL(file);
        const measuredDuration = await readAudioDuration(blobUrl);
        const parsed = parseLocalFilename(file.name);

        await storeLocalAudioBlob(id, file);

        created.push({
          id,
          title: parsed.title,
          artist: parsed.artist,
          album: language === 'tr' ? 'Yerel Dosyalar' : 'Local Files',
          duration: measuredDuration || 0,
          audioUrl: blobUrl,
          source: 'local',
          addedAt: Date.now(),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });
      }

      setLocalTracks((prev) => {
        const next = [...created, ...prev];
        saveLocalTrackMeta(next);
        return next;
      });

      setSelectedPlaylistId(null);
      setLibraryInitialSubTab('local');
      setActiveTab('library');

      showNotice(
        created.length === 1
          ? t.noticeUploadedSingle(created[0].title)
          : t.noticeUploadedMultiple(created.length)
      );
    },
    [language, showNotice, t]
  );

  const handleDeleteLocalTrack = useCallback(
    (trackId: string) => {
      const target = localTracks.find((t) => t.id === trackId);
      if (target?.audioUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.audioUrl);
      }
      deleteLocalAudioBlob(trackId);

      setLocalTracks((prev) => {
        const next = prev.filter((t) => t.id !== trackId);
        saveLocalTrackMeta(next);
        return next;
      });
      setQueue((prev) => prev.filter((t) => t.id !== trackId));
      showNotice(t.noticeRemovedLocal);
    },
    [localTracks, showNotice, t]
  );

  // Audio event handlers
  const handleTrackEnded = useCallback(() => {
    if (playerPrefs.repeat === 'one') {
      if (isUsingYouTubeIframe) {
        setYtSeekRequest({ time: 0, nonce: Date.now() });
        setIsPlaying(true);
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      return;
    }
    handleNext();
  }, [playerPrefs.repeat, isUsingYouTubeIframe, handleNext]);

  const ambientPalette = useMemo(
    () => getAmbientPaletteForTrack(currentTrack),
    [currentTrack]
  );
  const glowScale = themePrefs.ambientGlowEnabled
    ? themePrefs.ambientGlowIntensity / 100
    : 0;

  // Mandatory Login Gate: block player, audio, and library until Firebase Auth user is signed in
  if (!authReady) {
    return (
      <div className="h-dvh w-screen bg-[#070709] text-zinc-400 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
          <AudioLines className="w-5 h-5 text-white animate-pulse" />
        </div>
        <p className="text-xs font-medium tracking-wide">{t.loading}</p>
      </div>
    );
  }

  if (!cloudUser) {
    return (
      <AuthGate
        onAuthenticated={(user, isNewSignUp) => {
          setCloudUser(user);
          showNotice(
            isNewSignUp
              ? t.authSignUpVerifyHint
              : t.noticeSignedInAs(user.displayName || user.email || t.appName)
          );
        }}
      />
    );
  }

  return (
    <div
      data-density={themePrefs.layoutDensity}
      data-player-style={themePrefs.playerBarStyle}
      className="h-dvh w-screen overflow-hidden flex flex-col bg-[#070709] text-zinc-100"
    >
      {/* Hidden native audio & file input */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (!isUsingYouTubeIframe && audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (
            !isUsingYouTubeIframe &&
            audioRef.current &&
            Number.isFinite(audioRef.current.duration)
          ) {
            setDuration(currentTrack?.duration || audioRef.current.duration);
          }
        }}
        onEnded={() => {
          if (!isUsingYouTubeIframe) handleTrackEnded();
        }}
        onPause={() => {
          if (!isUsingYouTubeIframe) setIsPlaying(false);
        }}
        onPlay={() => {
          if (!isUsingYouTubeIframe) setIsPlaying(true);
        }}
      />

      {/* YouTube IFrame Player API Bridge */}
      <YouTubePlayerBridge
        videoId={currentTrack?.youtubeVideoId}
        active={isUsingYouTubeIframe}
        isPlaying={isPlaying}
        volume={playerPrefs.volume}
        muted={playerPrefs.muted}
        seekRequest={ytSeekRequest}
        showCompactVideo={appSettings.showCompactVideo}
        onTimeUpdate={(cur, dur) => {
          setCurrentTime(cur);
          if (dur > 0) setDuration(dur);
        }}
        onStateChange={(playing) => setIsPlaying(playing)}
        onEnded={handleTrackEnded}
        onFallbackUnavailable={() => {
          if (isPlaying) {
            pendingAutoplayRef.current = true;
          }
          setYtFallbackMode(true);
        }}
        onHideCompactVideo={() =>
          handleSaveSettings({ ...appSettings, showCompactVideo: false })
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg,audio/*"
        aria-label={t.actionUploadAudio}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            handleUploadFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Main Workspace: Sidebar + Scrollable Main Viewport */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          selectedPlaylistId={selectedPlaylistId}
          playlists={playlists}
          cloudUser={cloudUser}
          isSigningIn={isSigningIn}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setSelectedPlaylistId(null);
            if (tab === 'library') setLibraryInitialSubTab('playlists');
          }}
          onSelectPlaylist={(plId) => {
            setSelectedPlaylistId(plId);
            setActiveTab('library');
          }}
          onOpenNewPlaylist={() => {
            setPlaylistSeedTrack(null);
            setPlaylistModalOpen(true);
          }}
          onTriggerUpload={() => {
            setSelectedPlaylistId(null);
            setLibraryInitialSubTab('local');
            setActiveTab('library');
            fileInputRef.current?.click();
          }}
          onOpenLinkImport={() => setLinkImportModalOpen(true)}
          onOpenThemeCustomizer={() => openSettingsWithTab('theme')}
          onOpenSettings={() => openSettingsWithTab('api')}
          onSignInGoogle={handleSignInGoogle}
          onSignOutCloud={handleSignOutCloud}
        />

        <main className="relative flex-1 min-w-0 h-full overflow-y-auto">
          {/* Dynamic Liquid Glass Ambient Glow & Blurred Album Cover Backdrop */}
          {themePrefs.ambientGlowEnabled && glowScale > 0 && (
            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 overflow-hidden z-0 transition-opacity duration-500"
              style={{ opacity: glowScale }}
            >
              <motion.div
                key={`glow-primary-${currentTrack?.id || 'default'}`}
                initial={{ opacity: 0.4, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="absolute -top-32 left-1/4 w-[560px] h-[420px] rounded-full blur-[135px]"
                style={{ background: ambientPalette.primary }}
              />
              <motion.div
                key={`glow-secondary-${currentTrack?.id || 'default'}`}
                initial={{ opacity: 0.35, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                className="absolute top-24 right-10 w-[460px] h-[380px] rounded-full blur-[140px]"
                style={{ background: ambientPalette.secondary }}
              />
            </div>
          )}

          {currentTrack?.coverUrl && themePrefs.ambientGlowEnabled && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 right-0 h-[380px] overflow-hidden z-0"
              style={{ opacity: glowScale }}
            >
              <AnimatePresence mode="sync">
                <motion.img
                  key={currentTrack.coverUrl}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.24 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65 }}
                  src={currentTrack.coverUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover scale-125 blur-[96px] saturate-150"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-b from-[#070709]/35 via-[#070709]/75 to-[#070709]" />
            </div>
          )}

          {/* Sleek Mobile / Android Top Bar with Safe-Area Padding */}
          <div className="md:hidden relative z-10 flex items-center justify-between gap-2 px-4 pt-[max(0.625rem,env(safe-area-inset-top))] pb-2.5 border-b border-white/[0.08] liquid-glass-subtle">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-sm">
                <AudioLines className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display text-sm font-semibold text-white whitespace-nowrap">
                Cadence
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <PWAInstallButton compact />
              <button
                type="button"
                onClick={() =>
                  cloudUser ? openSettingsWithTab('api') : handleSignInGoogle()
                }
                aria-label={cloudUser ? t.mobileCloudSyncAria : t.sidebarSignInGoogle}
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  cloudUser
                    ? 'text-rose-400 bg-rose-500/15'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {cloudUser ? <Cloud className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlaylistId(null);
                  setLibraryInitialSubTab('local');
                  setActiveTab('library');
                  fileInputRef.current?.click();
                }}
                aria-label={t.mobileUploadAria}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.08] shrink-0"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => openSettingsWithTab('theme')}
                aria-label={t.mobileThemeAria}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:text-white hover:bg-white/[0.08] shrink-0"
              >
                <Palette className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => openSettingsWithTab('api')}
                aria-label={t.mobileSettingsAria}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.08] shrink-0"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Page View with Spring Transitions */}
          <div className="relative z-10">
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === 'home' && (
                <motion.div
                  key="tab-home"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                >
                  <HomeView
                    homeLayout={homeLayout}
                    layoutDensity={themePrefs.layoutDensity}
                    recentTracks={recentTracks}
                    quickPicks={SEED_TRACKS}
                    playlists={playlists}
                    allTracksMap={allTracksMap}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    favoriteIds={favoriteIds}
                    onPlayTrack={playTrack}
                    onToggleFavorite={handleToggleFavorite}
                    onSaveHomeLayout={handleSaveHomeLayout}
                    onOpenPlaylist={(plId) => {
                      setSelectedPlaylistId(plId);
                      setActiveTab('library');
                    }}
                    onOpenNewPlaylist={(seedTrack) => {
                      setPlaylistSeedTrack(seedTrack || null);
                      setPlaylistModalOpen(true);
                    }}
                    onAddToPlaylist={handleAddToPlaylist}
                    onAddToQueue={handleAddToQueue}
                    onOpenLyrics={handleOpenLyrics}
                    onOpenLinkImport={() => setLinkImportModalOpen(true)}
                    onOpenThemeCustomizer={() => openSettingsWithTab('theme')}
                  />
                </motion.div>
              )}

              {activeTab === 'search' && (
                <motion.div
                  key="tab-search"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                >
                  <SearchView
                    youtubeApiKey={appSettings.youtubeApiKey}
                    localAndCuratedTracks={localAndCuratedTracks}
                    playlists={playlists}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    favoriteIds={favoriteIds}
                    onPlayTrack={playTrack}
                    onToggleFavorite={handleToggleFavorite}
                    onAddToPlaylist={handleAddToPlaylist}
                    onAddToQueue={handleAddToQueue}
                    onOpenLyrics={handleOpenLyrics}
                    onOpenNewPlaylist={(seedTrack) => {
                      setPlaylistSeedTrack(seedTrack || null);
                      setPlaylistModalOpen(true);
                    }}
                    onCacheTracks={cacheExternalTracks}
                    onOpenLinkImport={() => setLinkImportModalOpen(true)}
                    onSearchCacheUpdated={refreshCacheCount}
                  />
                </motion.div>
              )}

              {activeTab === 'library' && (
                <motion.div
                  key={`tab-library-${selectedPlaylistId || libraryInitialSubTab}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                >
                  <LibraryView
                    playlists={playlists}
                    selectedPlaylistId={selectedPlaylistId}
                    initialSubTab={libraryInitialSubTab}
                    allTracksMap={allTracksMap}
                    localTracks={localTracks}
                    favoriteTracks={favoriteTracks}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    favoriteIds={favoriteIds}
                    onSelectPlaylist={setSelectedPlaylistId}
                    onPlayTrack={playTrack}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenNewPlaylist={(seedTrack) => {
                      setPlaylistSeedTrack(seedTrack || null);
                      setPlaylistModalOpen(true);
                    }}
                    onDeletePlaylist={handleDeletePlaylist}
                    onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
                    onAddToPlaylist={handleAddToPlaylist}
                    onAddToQueue={handleAddToQueue}
                    onOpenLyrics={handleOpenLyrics}
                    onTriggerUpload={() => fileInputRef.current?.click()}
                    onUploadFiles={handleUploadFiles}
                    onDeleteLocalTrack={handleDeleteLocalTrack}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Subtle Action Feedback Toast */}
      <AnimatePresence>
        {notice && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className="fixed bottom-28 md:bottom-24 right-4 sm:right-5 z-40 px-4 py-2.5 rounded-xl liquid-glass text-xs font-medium text-white shadow-2xl"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Player Bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={playerPrefs.volume}
        muted={playerPrefs.muted}
        shuffle={playerPrefs.shuffle}
        repeat={playerPrefs.repeat}
        isFavorite={currentTrack ? favoriteIds.has(currentTrack.id) : false}
        playerBarStyle={themePrefs.playerBarStyle}
        onTogglePlay={handleTogglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
        onSeek={handleSeek}
        onChangeVolume={(vol) =>
          updatePrefs((p) => ({ ...p, volume: vol, muted: vol === 0 }))
        }
        onToggleMute={() => updatePrefs((p) => ({ ...p, muted: !p.muted }))}
        onToggleShuffle={() => updatePrefs((p) => ({ ...p, shuffle: !p.shuffle }))}
        onCycleRepeat={() =>
          updatePrefs((p) => ({
            ...p,
            repeat: p.repeat === 'off' ? 'all' : p.repeat === 'all' ? 'one' : 'off',
          }))
        }
        onToggleFavorite={() => currentTrack && handleToggleFavorite(currentTrack.id)}
        onOpenNowPlaying={(tab = 'up-next') => {
          setNowPlayingTab(tab);
          setNowPlayingOpen(true);
        }}
      />

      {/* Sleek Mobile / Android Glassmorphic Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedPlaylistId(null);
          if (tab === 'library') setLibraryInitialSubTab('playlists');
        }}
        onOpenLinkImport={() => setLinkImportModalOpen(true)}
        onOpenThemeCustomizer={() => openSettingsWithTab('theme')}
      />

      {/* Full-Screen Now Playing & Synced Lyrics Overlay */}
      <NowPlayingOverlay
        open={nowPlayingOpen}
        activeTab={nowPlayingTab}
        currentTrack={currentTrack}
        queue={queue}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        shuffle={playerPrefs.shuffle}
        repeat={playerPrefs.repeat}
        isFavorite={currentTrack ? favoriteIds.has(currentTrack.id) : false}
        customLyricsMap={customLyricsMap}
        sleepTimerMinutes={sleepTimerMinutes}
        sleepRemainingSec={sleepRemainingSec}
        onSelectSleepTimer={handleSelectSleepTimer}
        onClose={() => setNowPlayingOpen(false)}
        onTabChange={setNowPlayingTab}
        onTogglePlay={handleTogglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
        onSeek={handleSeek}
        onToggleShuffle={() => updatePrefs((p) => ({ ...p, shuffle: !p.shuffle }))}
        onCycleRepeat={() =>
          updatePrefs((p) => ({
            ...p,
            repeat: p.repeat === 'off' ? 'all' : p.repeat === 'all' ? 'one' : 'off',
          }))
        }
        onToggleFavorite={() => currentTrack && handleToggleFavorite(currentTrack.id)}
        onPlayQueueTrack={(track) => playTrack(track)}
        onRemoveFromQueue={handleRemoveFromQueue}
        onSaveCustomLyrics={handleSaveCustomLyrics}
      />

      {/* Create Playlist Modal */}
      <PlaylistModal
        open={playlistModalOpen}
        onClose={() => {
          setPlaylistModalOpen(false);
          setPlaylistSeedTrack(null);
        }}
        onCreate={handleCreatePlaylist}
      />

      {/* Customize Theme, Cloud Sync & Settings Modal */}
      <SettingsModal
        open={settingsModalOpen}
        initialTab={settingsModalTab}
        settings={appSettings}
        themePrefs={themePrefs}
        cachedQueryCount={cachedQueryCount}
        cloudUser={cloudUser}
        isSigningIn={isSigningIn}
        onSignInGoogle={handleSignInGoogle}
        onSignOutCloud={handleSignOutCloud}
        onResendVerification={handleResendVerification}
        onRefreshVerification={handleRefreshVerification}
        onLanguageChanged={(nextLang: AppLanguage) => {
          showNotice(getTranslations(nextLang).noticeLanguageChanged);
        }}
        onClose={() => setSettingsModalOpen(false)}
        onSaveSettings={handleSaveSettings}
        onUpdateThemePrefs={handleUpdateThemePrefs}
        onResetThemePrefs={handleResetThemePrefs}
        onClearSearchCache={handleClearSearchCache}
      />

      {/* Link & Playlist Importer Modal */}
      <LinkImportModal
        open={linkImportModalOpen}
        youtubeApiKey={appSettings.youtubeApiKey}
        importedTracks={importedTracks}
        onClose={() => setLinkImportModalOpen(false)}
        onImportAndPlay={handleImportAndPlay}
        onImportPlaylist={handleImportPlaylist}
      />
    </div>
  );
}
