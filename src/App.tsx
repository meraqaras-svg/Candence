import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Settings, Shield } from 'lucide-react';
import type {
  ActiveAdState,
  AppLanguage,
  AppSettings,
  CloudUserProfile,
  HomeWidgetConfig,
  NavTab,
  NowPlayingTab,
  OfflineVaultStats,
  PaymentAdConfig,
  PlayerPrefs,
  Playlist,
  SleepTimerMinutes,
  ThemePrefs,
  Track,
  UserPlan,
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
  DEFAULT_AD_SPOT_DURATION_SEC,
  generateBuiltInAdSpotWavUrl,
  isAdminEmail,
  isUserAdFree,
  shouldPlayAudioAd,
  speakTurkishAdSpot,
  stopTurkishAdSpotSpeech,
} from './utils/audioAdEngine';
import {
  DEFAULT_THEME_PREFS,
  clearCachedLyricsDb,
  clearSearchCache,
  deleteLocalAudioBlob,
  getOfflineVaultStats,
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
  DEFAULT_PAYMENT_AD_CONFIG,
  mapFirebaseAuthError,
  mapFirestoreError,
  refreshCurrentUser,
  resendVerificationEmail,
  saveUserCloudSync,
  signInWithGoogle,
  signOutFromCloud,
  subscribeToAuthState,
  subscribeToPaymentAdConfig,
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
import { NowPlayingOverlay } from './components/NowPlayingOverlay';
import { PlaylistModal } from './components/PlaylistModal';
import { SettingsModal, type SettingsModalTab } from './components/SettingsModal';
import { LinkImportModal } from './components/LinkImportModal';
import { YouTubePlayerBridge } from './components/YouTubePlayerBridge';
import { AuthGate } from './components/AuthGate';
import { NyxonLogo } from './components/NyxonLogo';
import { NYXON_SPRING, ProgressiveBlur } from './components/MotionPrimitives';
import { NyxonProModal } from './components/NyxonProModal';
import { AdminPanelModal } from './components/AdminPanelModal';

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

  // Firebase Auth, Membership Plan & Cloud Sync state
  const [cloudUser, setCloudUser] = useState<CloudUserProfile | null>(null);
  const [userPlan, setUserPlan] = useState<UserPlan>('free');
  const [paymentConfig, setPaymentConfig] = useState<PaymentAdConfig>(
    DEFAULT_PAYMENT_AD_CONFIG
  );
  const [authReady, setAuthReady] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isApplyingRemoteRef = useRef(false);

  // Offline IndexedDB Vault Stats
  const [vaultStats, setVaultStats] = useState<OfflineVaultStats>({
    audioTrackCount: 0,
    audioBytes: 0,
    cachedLyricsCount: 0,
    quotaBytes: null,
    usageBytes: null,
  });

  // Unskippable Turkish Audio Ad Engine (Free tier, every 3 songs)
  const [adState, setAdState] = useState<ActiveAdState | null>(null);
  const adAudioRef = useRef<HTMLAudioElement | null>(null);
  const songsSinceLastAdRef = useRef(0);
  const pendingTrackAfterAdRef = useRef<{ track: Track; queueList?: Track[] } | null>(null);
  const adFallbackTimerRef = useRef<number | null>(null);

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
  const [proModalOpen, setProModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const pendingAutoplayRef = useRef(false);

  const isAdActive = Boolean(adState?.active);
  const isAdminUser = isAdminEmail(cloudUser?.email);
  const isAdFreeUser = isUserAdFree(userPlan, cloudUser?.email);

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

  const refreshVaultStats = useCallback(() => {
    void getOfflineVaultStats().then((stats) => setVaultStats(stats));
  }, []);

  // Subscribe to Firebase Auth state (mandatory login gate enforces authentication)
  useEffect(() => {
    const unsub = subscribeToAuthState((user) => {
      setCloudUser(user);
      if (!user) {
        setUserPlan('free');
      } else if (isAdminEmail(user.email)) {
        setUserPlan('pro');
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Subscribe to Firestore Payment & Audio Ad Configuration when signed in
  useEffect(() => {
    if (!cloudUser?.uid) {
      setPaymentConfig(DEFAULT_PAYMENT_AD_CONFIG);
      return;
    }
    return subscribeToPaymentAdConfig((cfg) => setPaymentConfig(cfg));
  }, [cloudUser?.uid]);

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
        if (remote.plan) {
          setUserPlan(isAdminEmail(cloudUser.email) ? 'pro' : remote.plan);
        }
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
        // Initialize cloud document with current local state + profile on first sign-in
        void saveUserCloudSync(
          cloudUser.uid,
          latestLocalSyncRef.current,
          handleCloudSyncError,
          { email: cloudUser.email, displayName: cloudUser.displayName }
        );
      },
      handleCloudSyncError
    );
    return () => unsub();
  }, [cloudUser?.uid, cloudUser?.email, cloudUser?.displayName, handleCloudSyncError]);

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
        handleCloudSyncError,
        { email: cloudUser.email, displayName: cloudUser.displayName }
      );
    }, 450);
    return () => window.clearTimeout(timer);
  }, [
    cloudUser?.uid,
    cloudUser?.email,
    cloudUser?.displayName,
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
    if (adAudioRef.current) {
      adAudioRef.current.pause();
      adAudioRef.current.currentTime = 0;
    }
    if (adFallbackTimerRef.current) {
      window.clearTimeout(adFallbackTimerRef.current);
      adFallbackTimerRef.current = null;
    }
    stopTurkishAdSpotSpeech();
    pendingTrackAfterAdRef.current = null;
    songsSinceLastAdRef.current = 0;
    setAdState(null);
    setIsPlaying(false);
    setNowPlayingOpen(false);
    setSettingsModalOpen(false);
    setPlaylistModalOpen(false);
    setLinkImportModalOpen(false);
    setProModalOpen(false);
    setAdminModalOpen(false);
    await signOutFromCloud();
    setCloudUser(null);
    setUserPlan('free');
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

  // Hydrate persisted local audio blobs & storage metrics from IndexedDB on startup
  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const savedMeta = loadLocalTrackMeta();
      if (savedMeta.length > 0) {
        const hydrated = await Promise.all(
          savedMeta.map(async (track) => {
            const url = await loadLocalAudioBlobUrl(track.id);
            return url ? { ...track, audioUrl: url } : track;
          })
        );
        if (active) {
          setLocalTracks(hydrated);
        }
      }
      const stats = await getOfflineVaultStats();
      if (active) {
        setVaultStats(stats);
      }
    };
    void hydrate();
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

  // Keep HTML5 music & ad audio volume & mute synced
  useEffect(() => {
    const vol = playerPrefs.muted ? 0 : playerPrefs.volume;
    if (audioRef.current) {
      audioRef.current.volume = vol;
      audioRef.current.muted = playerPrefs.muted;
    }
    if (adAudioRef.current) {
      adAudioRef.current.volume = vol;
      adAudioRef.current.muted = playerPrefs.muted;
    }
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

  const commitTrackPlayback = useCallback(
    (track: Track, queueList?: Track[]) => {
      if (queueList && queueList.length > 0) {
        setQueue(queueList);
      } else {
        setQueue((prev) => (prev.some((tr) => tr.id === track.id) ? prev : [track, ...prev]));
      }
      setYtFallbackMode(false);
      pendingAutoplayRef.current = true;
      setCurrentTrack(track);
      recordRecent(track);
    },
    [recordRecent]
  );

  const finishAudioAdAndResumePending = useCallback(() => {
    if (adFallbackTimerRef.current) {
      window.clearTimeout(adFallbackTimerRef.current);
      adFallbackTimerRef.current = null;
    }
    if (adAudioRef.current) {
      adAudioRef.current.pause();
      adAudioRef.current.currentTime = 0;
    }
    stopTurkishAdSpotSpeech();
    setAdState(null);

    const pending = pendingTrackAfterAdRef.current;
    pendingTrackAfterAdRef.current = null;
    if (pending) {
      commitTrackPlayback(pending.track, pending.queueList);
    } else {
      setIsPlaying(false);
    }
  }, [commitTrackPlayback]);

  // If user becomes Pro/Admin while an ad is playing, immediately skip the ad & start their track
  useEffect(() => {
    if (isAdFreeUser && adState?.active) {
      finishAudioAdAndResumePending();
    }
  }, [isAdFreeUser, adState?.active, finishAudioAdAndResumePending]);

  const startAudioAdForPendingTrack = useCallback(
    (nextTrack: Track, queueList?: Track[]) => {
      audioRef.current?.pause();
      pendingTrackAfterAdRef.current = { track: nextTrack, queueList };

      const customUrl = paymentConfig.customAdAudioUrl?.trim() || '';
      const isCustomAudio = /^https?:\/\//i.test(customUrl);
      const srcUrl = isCustomAudio ? customUrl : generateBuiltInAdSpotWavUrl();

      setAdState({
        active: true,
        title: t.adBannerLabel,
        subtitle: t.adBannerSubtitle,
        durationSec: DEFAULT_AD_SPOT_DURATION_SEC,
        currentTimeSec: 0,
        remainingSec: DEFAULT_AD_SPOT_DURATION_SEC,
        isCustomAudio,
      });
      setIsPlaying(true);

      const adEl = adAudioRef.current;
      if (!adEl) {
        finishAudioAdAndResumePending();
        return;
      }

      adEl.volume = playerPrefs.muted ? 0 : playerPrefs.volume;
      adEl.muted = playerPrefs.muted;
      adEl.src = srcUrl;
      adEl.load();

      if (!isCustomAudio && !playerPrefs.muted) {
        speakTurkishAdSpot(playerPrefs.volume);
      }

      adEl.play().catch(() => {
        // Fallback safety: if autoplay or custom audio fails, finish smoothly so playback never stalls
        if (adFallbackTimerRef.current) {
          window.clearTimeout(adFallbackTimerRef.current);
        }
        adFallbackTimerRef.current = window.setTimeout(() => {
          finishAudioAdAndResumePending();
        }, 3500);
      });
    },
    [
      finishAudioAdAndResumePending,
      paymentConfig.customAdAudioUrl,
      playerPrefs.muted,
      playerPrefs.volume,
      t.adBannerLabel,
      t.adBannerSubtitle,
    ]
  );

  const requestTrackTransition = useCallback(
    (nextTrack: Track, queueList?: Track[]) => {
      if (isAdActive) return;

      if (!isAdFreeUser) {
        songsSinceLastAdRef.current += 1;
        if (
          shouldPlayAudioAd({
            plan: userPlan,
            email: cloudUser?.email,
            songsSinceLastAd: songsSinceLastAdRef.current,
          })
        ) {
          songsSinceLastAdRef.current = 0;
          startAudioAdForPendingTrack(nextTrack, queueList);
          return;
        }
      }

      commitTrackPlayback(nextTrack, queueList);
    },
    [
      cloudUser?.email,
      commitTrackPlayback,
      isAdActive,
      isAdFreeUser,
      startAudioAdForPendingTrack,
      userPlan,
    ]
  );

  const playTrack = useCallback(
    (track: Track, queueList?: Track[]) => {
      if (isAdActive) return;

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

      requestTrackTransition(track, queueList);
    },
    [
      currentTrack?.id,
      isAdActive,
      isPlaying,
      requestTrackTransition,
      resolvePlayableAudioUrl,
      showNotice,
      t,
      ytFallbackMode,
    ]
  );

  const handleTogglePlay = useCallback(() => {
    if (isAdActive) {
      const adEl = adAudioRef.current;
      if (!adEl) return;
      if (adEl.paused) {
        adEl
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else {
        adEl.pause();
        stopTurkishAdSpotSpeech();
        setIsPlaying(false);
      }
      return;
    }

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
  }, [
    currentTrack,
    isAdActive,
    isPlaying,
    isUsingYouTubeIframe,
    resolvePlayableAudioUrl,
    showNotice,
    t,
  ]);

  const handleNext = useCallback(() => {
    if (isAdActive) return;
    if (!currentTrack || queue.length === 0) return;

    if (playerPrefs.shuffle && queue.length > 1) {
      const candidates = queue.filter((tr) => tr.id !== currentTrack.id);
      const nextTrack = candidates[Math.floor(Math.random() * candidates.length)];
      if (nextTrack) {
        requestTrackTransition(nextTrack);
      }
      return;
    }

    const idx = queue.findIndex((tr) => tr.id === currentTrack.id);
    if (idx === -1) {
      requestTrackTransition(queue[0]);
      return;
    }

    if (idx + 1 < queue.length) {
      requestTrackTransition(queue[idx + 1]);
    } else if (playerPrefs.repeat === 'all') {
      requestTrackTransition(queue[0]);
    } else {
      setIsPlaying(false);
    }
  }, [
    currentTrack,
    isAdActive,
    playerPrefs.repeat,
    playerPrefs.shuffle,
    queue,
    requestTrackTransition,
  ]);

  const handlePrev = useCallback(() => {
    if (isAdActive) return;
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

    const idx = queue.findIndex((tr) => tr.id === currentTrack.id);
    const prevIdx = idx > 0 ? idx - 1 : queue.length - 1;
    const prevTrack = queue[prevIdx];
    if (prevTrack) {
      requestTrackTransition(prevTrack);
    }
  }, [
    currentTime,
    currentTrack,
    isAdActive,
    isUsingYouTubeIframe,
    queue,
    requestTrackTransition,
  ]);

  const handleSeek = useCallback(
    (time: number) => {
      if (isAdActive) return;
      setCurrentTime(time);
      if (isUsingYouTubeIframe) {
        setYtSeekRequest({ time, nonce: Date.now() });
      } else if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
    },
    [isAdActive, isUsingYouTubeIframe]
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
      refreshVaultStats();

      showNotice(
        created.length === 1
          ? t.noticeUploadedSingle(created[0].title)
          : t.noticeUploadedMultiple(created.length)
      );
    },
    [language, refreshVaultStats, showNotice, t]
  );

  const handleDeleteLocalTrack = useCallback(
    (trackId: string) => {
      const target = localTracks.find((tr) => tr.id === trackId);
      if (target?.audioUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(target.audioUrl);
      }
      void deleteLocalAudioBlob(trackId).then(() => refreshVaultStats());

      setLocalTracks((prev) => {
        const next = prev.filter((tr) => tr.id !== trackId);
        saveLocalTrackMeta(next);
        return next;
      });
      setQueue((prev) => prev.filter((tr) => tr.id !== trackId));
      showNotice(t.noticeRemovedLocal);
    },
    [localTracks, refreshVaultStats, showNotice, t]
  );

  const handleClearCachedLyrics = useCallback(() => {
    void clearCachedLyricsDb().then(() => {
      refreshVaultStats();
      showNotice(t.noticeLyricsCacheCleared);
    });
  }, [refreshVaultStats, showNotice, t]);

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
      <div className="h-dvh w-screen bg-[#050508] text-zinc-400 flex flex-col items-center justify-center gap-3.5">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={NYXON_SPRING}
        >
          <NyxonLogo size="lg" />
        </motion.div>
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-zinc-400">
          {t.loading}
        </p>
      </div>
    );
  }

  if (!cloudUser) {
    return (
      <AuthGate
        onAuthenticated={(user, isNewSignUp) => {
          setCloudUser(user);
          if (isAdminEmail(user.email)) {
            setUserPlan('pro');
          }
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
      className="h-dvh w-screen overflow-hidden flex flex-col bg-[#050508] text-zinc-100"
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

      {/* Dedicated Unskippable Audio Ad Element */}
      <audio
        ref={adAudioRef}
        onLoadedMetadata={() => {
          const el = adAudioRef.current;
          if (!el || !Number.isFinite(el.duration) || el.duration <= 0) return;
          setAdState((prev) =>
            prev
              ? {
                  ...prev,
                  durationSec: el.duration,
                  remainingSec: Math.max(0, el.duration - el.currentTime),
                }
              : prev
          );
        }}
        onTimeUpdate={() => {
          const el = adAudioRef.current;
          if (!el) return;
          setAdState((prev) => {
            if (!prev) return prev;
            const dur =
              Number.isFinite(el.duration) && el.duration > 0 ? el.duration : prev.durationSec;
            return {
              ...prev,
              durationSec: dur,
              currentTimeSec: el.currentTime,
              remainingSec: Math.max(0, dur - el.currentTime),
            };
          });
        }}
        onEnded={() => finishAudioAdAndResumePending()}
        onError={() => {
          const el = adAudioRef.current;
          if (adState?.isCustomAudio && el) {
            // Custom MP3 failed — fall back to built-in Turkish NYXON spot once
            const fallbackUrl = generateBuiltInAdSpotWavUrl();
            setAdState((prev) =>
              prev ? { ...prev, isCustomAudio: false, durationSec: DEFAULT_AD_SPOT_DURATION_SEC } : prev
            );
            el.src = fallbackUrl;
            el.load();
            if (!playerPrefs.muted) {
              speakTurkishAdSpot(playerPrefs.volume);
            }
            el.play().catch(() => finishAudioAdAndResumePending());
          } else {
            finishAudioAdAndResumePending();
          }
        }}
      />

      {/* YouTube IFrame Player API Bridge */}
      <YouTubePlayerBridge
        videoId={currentTrack?.youtubeVideoId}
        active={isUsingYouTubeIframe && !isAdActive}
        isPlaying={isPlaying && !isAdActive}
        volume={playerPrefs.volume}
        muted={playerPrefs.muted}
        seekRequest={ytSeekRequest}
        showCompactVideo={appSettings.showCompactVideo}
        onTimeUpdate={(cur, dur) => {
          if (!isAdActive) {
            setCurrentTime(cur);
            if (dur > 0) setDuration(dur);
          }
        }}
        onStateChange={(playing) => {
          if (!isAdActive) setIsPlaying(playing);
        }}
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
          userPlan={userPlan}
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
          onOpenProModal={() => setProModalOpen(true)}
          onOpenAdminPanel={() => {
            if (isAdminUser) setAdminModalOpen(true);
          }}
          onSignInGoogle={handleSignInGoogle}
          onSignOutCloud={handleSignOutCloud}
        />

        {/* Seamless Full-Viewport Ambient Glow (single fixed radial layer, zero mid-screen seam) */}
        {themePrefs.ambientGlowEnabled && glowScale > 0 && (
          <motion.div
            key={`ambient-glow-${currentTrack?.id || 'default'}`}
            aria-hidden="true"
            initial={{ opacity: 0.45 * glowScale }}
            animate={{ opacity: glowScale }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="fixed inset-0 h-dvh w-screen pointer-events-none z-0"
            style={{
              backgroundImage: `radial-gradient(ellipse 85% 58% at 22% -4%, ${ambientPalette.primary} 0%, transparent 72%), radial-gradient(ellipse 75% 52% at 86% 14%, ${ambientPalette.secondary} 0%, transparent 74%)`,
            }}
          />
        )}

        <main className="relative z-10 flex-1 min-w-0 h-full overflow-y-auto">
          <ProgressiveBlur direction="top" className="hidden md:block" />

          {/* Clean Ultra-Compact Mobile Top Bar: NYXON logo + max 2-3 icon buttons */}
          <header className="md:hidden sticky top-0 z-20 flex items-center justify-between gap-3 px-4 pt-[max(0.55rem,env(safe-area-inset-top))] pb-2.5 border-b border-white/[0.07] bg-[#050508]/75 backdrop-blur-2xl">
            <NyxonLogo size="xs" showWordmark />

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setProModalOpen(true)}
                aria-label={t.sidebarNyxonPro}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isAdFreeUser
                    ? 'text-amber-300 bg-amber-400/12 border border-amber-400/25'
                    : 'text-violet-300 bg-violet-500/14 border border-violet-400/25'
                }`}
              >
                <Crown className="w-4 h-4" />
              </button>
              {isAdminUser && (
                <button
                  type="button"
                  onClick={() => setAdminModalOpen(true)}
                  aria-label={t.sidebarAdminPanel}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-cyan-300 bg-cyan-500/14 border border-cyan-400/30"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => openSettingsWithTab('api')}
                aria-label={t.mobileSettingsAria}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-200 hover:text-white bg-white/[0.05] border border-white/[0.09] shrink-0 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </header>

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
                    vaultStats={vaultStats}
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
                    onClearCachedLyrics={handleClearCachedLyrics}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <ProgressiveBlur direction="bottom" />
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
        adState={adState}
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
        onOpenProModal={() => setProModalOpen(true)}
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
        adState={adState}
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
        onLyricsCached={refreshVaultStats}
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

      {/* NYXON Pro Membership & Promo Code Redemption Modal */}
      <NyxonProModal
        open={proModalOpen}
        cloudUser={cloudUser}
        userPlan={userPlan}
        paymentConfig={paymentConfig}
        onClose={() => setProModalOpen(false)}
        onProUnlocked={() => {
          setUserPlan('pro');
          showNotice(t.noticeProUnlocked);
        }}
      />

      {/* Admin Panel Modal (STRICTLY only for meraqaras@gmail.com) */}
      {isAdminUser && (
        <AdminPanelModal
          open={adminModalOpen}
          adminEmail={cloudUser?.email}
          paymentConfig={paymentConfig}
          onClose={() => setAdminModalOpen(false)}
        />
      )}
    </div>
  );
}
