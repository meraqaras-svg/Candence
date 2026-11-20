import type { Track } from '../types/music';

export interface MediaSessionCallbacks {
  onPlay: () => void;
  onPause: () => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
  onSeekTo: (timeSeconds: number) => void;
}

/**
 * Updates the browser / Android lock screen & notification shade Media Session metadata
 * and playback state.
 */
export function updateMediaSessionMetadata(
  track: Track | null,
  isPlaying: boolean,
  currentTime: number,
  duration: number
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  try {
    if (!track) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    const artworkUrl = track.coverUrl || '/pwa-512x512.png';
    if (typeof MediaMetadata !== 'undefined') {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album || 'NYXON',
        artwork: [
          { src: artworkUrl, sizes: '192x192', type: 'image/png' },
          { src: artworkUrl, sizes: '512x512', type: 'image/png' },
        ],
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    const effectiveDuration = duration > 0 ? duration : track.duration || 0;
    if (
      effectiveDuration > 0 &&
      typeof navigator.mediaSession.setPositionState === 'function'
    ) {
      navigator.mediaSession.setPositionState({
        duration: Math.max(1, effectiveDuration),
        playbackRate: 1,
        position: Math.min(Math.max(0, currentTime), Math.max(1, effectiveDuration)),
      });
    }
  } catch {
    // Ignore unsupported mediaSession position or artwork errors on older browsers
  }
}

export function registerMediaSessionHandlers(
  callbacks: MediaSessionCallbacks
): () => void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return () => {};
  }

  const actions: Array<[MediaSessionAction, MediaSessionActionHandler]> = [
    ['play', () => callbacks.onPlay()],
    ['pause', () => callbacks.onPause()],
    ['previoustrack', () => callbacks.onPreviousTrack()],
    ['nexttrack', () => callbacks.onNextTrack()],
    [
      'seekto',
      (details) => {
        if (typeof details.seekTime === 'number' && Number.isFinite(details.seekTime)) {
          callbacks.onSeekTo(details.seekTime);
        }
      },
    ],
  ];

  for (const [action, handler] of actions) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      // Ignore unsupported actions
    }
  }

  return () => {
    for (const [action] of actions) {
      try {
        navigator.mediaSession.setActionHandler(action, null);
      } catch {
        // Ignore cleanup errors
      }
    }
  };
}
