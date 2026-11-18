import { useEffect, useRef, useState } from 'react';
import { EyeOff } from 'lucide-react';
import { useI18n } from '../utils/I18nContext';

interface YTPlayerInstance {
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string, startSeconds?: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerBridgeProps {
  videoId: string | undefined;
  active: boolean;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  seekRequest: { time: number; nonce: number } | null;
  showCompactVideo: boolean;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onStateChange: (playing: boolean) => void;
  onEnded: () => void;
  onFallbackUnavailable: () => void;
  onHideCompactVideo: () => void;
}

let ytScriptLoaded = false;
const readyCallbacks: Array<() => void> = [];

function ensureYouTubeIframeApi(onReady: () => void) {
  if (typeof window === 'undefined') return;
  if (window.YT && window.YT.Player) {
    onReady();
    return;
  }

  readyCallbacks.push(onReady);
  if (ytScriptLoaded) return;
  ytScriptLoaded = true;

  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    if (prev) prev();
    while (readyCallbacks.length > 0) {
      const cb = readyCallbacks.shift();
      cb?.();
    }
  };

  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  script.async = true;
  script.onerror = () => {
    // Allow fallback audio engine if YouTube IFrame script is blocked by network/firewall
  };
  document.head.appendChild(script);
}

export function YouTubePlayerBridge({
  videoId,
  active,
  isPlaying,
  volume,
  muted,
  seekRequest,
  showCompactVideo,
  onTimeUpdate,
  onStateChange,
  onEnded,
  onFallbackUnavailable,
  onHideCompactVideo,
}: YouTubePlayerBridgeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const loadedVideoIdRef = useRef<string | undefined>(undefined);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const callbacksRef = useRef({
    onTimeUpdate,
    onStateChange,
    onEnded,
    onFallbackUnavailable,
  });
  callbacksRef.current = {
    onTimeUpdate,
    onStateChange,
    onEnded,
    onFallbackUnavailable,
  };

  // Initialize YT.Player once
  useEffect(() => {
    let mounted = true;
    const fallbackTimer = window.setTimeout(() => {
      if (mounted && !playerRef.current && active) {
        callbacksRef.current.onFallbackUnavailable();
      }
    }, 3500);

    ensureYouTubeIframeApi(() => {
      if (!mounted || !containerRef.current || !window.YT?.Player) return;
      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          width: '240',
          height: '135',
          videoId: videoId || 'a5uQMwRMHcs',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              if (!mounted) return;
              window.clearTimeout(fallbackTimer);
              setPlayerReady(true);
              loadedVideoIdRef.current = videoId || 'a5uQMwRMHcs';
              e.target.setVolume(Math.round(volume * 100));
              if (muted) e.target.mute();
              if (active && isPlayingRef.current && videoId) {
                e.target.loadVideoById(videoId);
              }
            },
            onStateChange: (e) => {
              if (!mounted) return;
              // 0 = ENDED, 1 = PLAYING, 2 = PAUSED
              if (e.data === 0) {
                callbacksRef.current.onEnded();
              } else if (e.data === 1) {
                callbacksRef.current.onStateChange(true);
              } else if (e.data === 2) {
                callbacksRef.current.onStateChange(false);
              }
            },
            onError: () => {
              if (!mounted) return;
              callbacksRef.current.onFallbackUnavailable();
            },
          },
        });
      } catch {
        callbacksRef.current.onFallbackUnavailable();
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  // Load new videoId when track changes
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playerReady || !active || !videoId) return;

    try {
      if (loadedVideoIdRef.current !== videoId) {
        loadedVideoIdRef.current = videoId;
        if (isPlaying) {
          player.loadVideoById(videoId, 0);
        } else {
          player.cueVideoById(videoId, 0);
        }
      }
    } catch {
      callbacksRef.current.onFallbackUnavailable();
    }
  }, [videoId, active, playerReady, isPlaying]);

  // Sync Play / Pause state
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playerReady) return;

    try {
      if (!active) {
        player.pauseVideo();
        return;
      }
      const state = player.getPlayerState?.();
      if (isPlaying && state !== 1) {
        player.playVideo();
      } else if (!isPlaying && state === 1) {
        player.pauseVideo();
      }
    } catch {
      // Ignore transient state errors
    }
  }, [active, isPlaying, playerReady]);

  // Sync Volume & Mute
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playerReady) return;
    try {
      player.setVolume(Math.round(volume * 100));
      if (muted || volume === 0) {
        player.mute();
      } else {
        player.unMute();
      }
    } catch {
      // Ignore
    }
  }, [volume, muted, playerReady]);

  // Sync Seek requests from bottom player bar or lyrics
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playerReady || !active || !seekRequest) return;
    try {
      player.seekTo(seekRequest.time, true);
    } catch {
      // Ignore
    }
  }, [seekRequest, active, playerReady]);

  // Poll current time & duration while active
  useEffect(() => {
    if (!active || !playerReady) return;
    const id = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      try {
        const cur = player.getCurrentTime?.() || 0;
        const dur = player.getDuration?.() || 0;
        if (cur > 0 || dur > 0) {
          callbacksRef.current.onTimeUpdate(cur, dur);
        }
      } catch {
        // Ignore
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [active, playerReady]);

  const { t } = useI18n();
  const visibleBox = active && showCompactVideo;

  return (
    <div
      aria-label="YouTube IFrame player container"
      className={
        visibleBox
          ? 'fixed bottom-24 right-5 z-30 w-60 rounded-2xl overflow-hidden bg-zinc-950/95 border border-white/[0.12] shadow-2xl'
          : 'fixed -bottom-96 -left-96 w-px h-px opacity-0 pointer-events-none overflow-hidden'
      }
    >
      {visibleBox && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-white/[0.08] text-[11px] text-zinc-300">
          <span>{t.ytStreamLabel}</span>
          <button
            type="button"
            onClick={onHideCompactVideo}
            aria-label={t.ytHideAria}
            className="text-zinc-400 hover:text-white flex items-center gap-1"
          >
            <EyeOff className="w-3 h-3" />
            <span>{t.ytHideLabel}</span>
          </button>
        </div>
      )}
      <div className="w-60 h-[135px] bg-black">
        <div ref={containerRef} />
      </div>
    </div>
  );
}
