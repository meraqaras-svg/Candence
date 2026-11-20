import {
  Crown,
  FileText,
  Heart,
  ListMusic,
  Lock,
  Maximize2,
  Pause,
  Play,
  Radio,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {
  ActiveAdState,
  NowPlayingTab,
  PlayerBarStyle,
  RepeatMode,
  Track,
} from '../types/music';
import { formatTime } from '../utils/formatters';
import { useI18n } from '../utils/I18nContext';
import { CoverArt } from './CoverArt';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  isFavorite: boolean;
  playerBarStyle?: PlayerBarStyle;
  adState?: ActiveAdState | null;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onChangeVolume: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleFavorite: () => void;
  onOpenNowPlaying: (tab?: NowPlayingTab) => void;
  onOpenProModal?: () => void;
}

export function PlayerBar({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  muted,
  shuffle,
  repeat,
  isFavorite,
  playerBarStyle = 'docked',
  adState = null,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onChangeVolume,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onToggleFavorite,
  onOpenNowPlaying,
  onOpenProModal,
}: PlayerBarProps) {
  const { language, t } = useI18n();
  const isAdActive = Boolean(adState?.active);

  const displayCurrentTime = isAdActive ? adState!.currentTimeSec : currentTime;
  const effectiveDuration = isAdActive
    ? Math.max(1, adState!.durationSec)
    : duration > 0
      ? duration
      : currentTrack?.duration || 0;
  const progressPct =
    effectiveDuration > 0
      ? Math.min(100, Math.max(0, (displayCurrentTime / effectiveDuration) * 100))
      : 0;

  const isFloating = playerBarStyle === 'floating';
  const repeatLabel =
    language === 'tr'
      ? repeat === 'off'
        ? 'kapalı'
        : repeat === 'all'
          ? 'tümü'
          : 'tek'
      : repeat;

  return (
    <footer
      aria-label={t.playerBarAria}
      data-player-style={playerBarStyle}
      className={
        isFloating
          ? 'relative z-30 shrink-0 mx-2.5 sm:mx-6 mb-1.5 sm:mb-3 rounded-2xl liquid-glass px-3 sm:px-5 py-2 sm:py-2.5 overflow-hidden'
          : 'relative z-30 shrink-0 liquid-glass border-t border-white/[0.12] border-x-0 border-b-0 px-3 sm:px-5 py-2 sm:py-3'
      }
    >
      {/* Sleek Sponsored Audio Ad Banner when Free-tier Audio Ad is active */}
      {isAdActive && adState && (
        <div
          role="status"
          aria-live="polite"
          className="mb-2 -mx-3 sm:-mx-5 -mt-2 sm:-mt-3 px-3 sm:px-5 py-2 bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-cyan-500/20 border-b border-white/[0.12] flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="text-xs font-semibold text-white truncate">
              {t.adBannerLabel}
            </span>
            <span className="text-xs text-amber-200 font-mono-tabular shrink-0">
              · {t.adRemainingSec(Math.max(1, Math.ceil(adState.remainingSec)))}
            </span>
            <span className="hidden md:inline text-[11px] text-zinc-300 truncate">
              · {t.adLockedHint}
            </span>
          </div>

          {onOpenProModal && (
            <button
              type="button"
              onClick={onOpenProModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shrink-0"
            >
              <Crown className="w-3 h-3 text-violet-600" />
              <span>{t.adUpgradeCta}</span>
            </button>
          )}
        </div>
      )}

      {/* Mobile thin top progress bar */}
      <div className="sm:hidden absolute top-0 left-0 right-0 h-0.5 bg-white/[0.08]">
        <div
          className={`h-full transition-[width] duration-150 ${
            isAdActive ? 'bg-amber-400' : 'bg-rose-500'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2.5 sm:gap-6">
        {/* Left: Track Info OR Ad Spot Info */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 sm:flex-initial sm:w-[260px] lg:w-[320px]">
          {isAdActive && adState ? (
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/25 via-violet-500/25 to-cyan-500/25 border border-white/[0.15] flex items-center justify-center text-amber-300 shrink-0">
                <Radio className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{adState.title}</div>
                <div className="text-xs text-zinc-400 truncate">{adState.subtitle}</div>
              </div>
            </div>
          ) : currentTrack ? (
            <>
              <button
                type="button"
                onClick={() => onOpenNowPlaying('up-next')}
                aria-label={t.playerOpenNowPlayingAria(currentTrack.title)}
                className="flex items-center gap-2.5 sm:gap-3 min-w-0 text-left group focus-visible:outline-2 focus-visible:outline-rose-500 rounded-lg"
              >
                <CoverArt
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  size="sm"
                  className="group-hover:brightness-110 transition"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate group-hover:underline">
                    {currentTrack.title}
                  </div>
                  <div className="text-xs text-zinc-400 truncate">
                    {currentTrack.artist}
                    {currentTrack.album ? (
                      <span className="hidden sm:inline"> · {currentTrack.album}</span>
                    ) : null}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={onToggleFavorite}
                aria-label={
                  isFavorite
                    ? t.favRemoveAria(currentTrack.title)
                    : t.favAddAria(currentTrack.title)
                }
                className={`hidden sm:flex w-8 h-8 rounded-lg items-center justify-center shrink-0 transition-colors ${
                  isFavorite ? 'text-rose-400' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </>
          ) : (
            <div className="text-xs text-zinc-500">{t.playerEmptyState}</div>
          )}
        </div>

        {/* Center: Transport + Scrubber (Next/Prev/Seek LOCKED while Audio Ad plays) */}
        <div className="flex flex-col items-center gap-1.5 sm:flex-1 max-w-[540px]">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={onToggleShuffle}
              disabled={isAdActive}
              aria-label={shuffle ? t.playerDisableShuffle : t.playerEnableShuffle}
              aria-pressed={shuffle}
              className={`hidden sm:flex w-8 h-8 rounded-lg items-center justify-center disabled:opacity-30 transition-colors ${
                shuffle ? 'text-rose-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onPrev}
              disabled={!currentTrack || isAdActive}
              aria-label={t.playerPrevTrack}
              title={isAdActive ? t.adLockedHint : t.playerPrevTrack}
              className="hidden xs:flex sm:flex w-8 h-8 rounded-lg items-center justify-center text-zinc-300 hover:text-white disabled:opacity-25 transition-colors"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              disabled={!currentTrack && !isAdActive}
              aria-label={isPlaying ? t.playerPause : t.playerPlay}
              className="w-9 h-9 rounded-full bg-white text-zinc-950 hover:scale-105 active:scale-95 disabled:opacity-35 flex items-center justify-center transition-transform shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!currentTrack || isAdActive}
              aria-label={t.playerNextTrack}
              title={isAdActive ? t.adLockedHint : t.playerNextTrack}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white disabled:opacity-25 transition-colors"
            >
              {isAdActive ? (
                <Lock className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <SkipForward className="w-4 h-4 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={onCycleRepeat}
              disabled={isAdActive}
              aria-label={t.playerRepeatAria(repeatLabel)}
              className={`hidden sm:flex w-8 h-8 rounded-lg items-center justify-center disabled:opacity-30 transition-colors ${
                repeat !== 'off' ? 'text-rose-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {repeat === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Desktop Progress Scrubber */}
          <div className="hidden sm:flex items-center gap-2.5 w-full">
            <span className="text-[11px] text-zinc-400 font-mono-tabular w-9 text-right shrink-0">
              {formatTime(displayCurrentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={effectiveDuration || 1}
              step={0.1}
              value={Math.min(displayCurrentTime, effectiveDuration || 1)}
              disabled={isAdActive || !currentTrack || effectiveDuration <= 0}
              onChange={(e) => {
                if (!isAdActive) onSeek(Number(e.target.value));
              }}
              aria-label={t.playerSeekAria}
              className={`w-full h-1.5 rounded-full bg-white/[0.14] ${
                isAdActive
                  ? 'accent-amber-400 cursor-not-allowed opacity-80'
                  : 'accent-white cursor-pointer'
              }`}
            />
            <span className="text-[11px] text-zinc-400 font-mono-tabular w-9 shrink-0">
              {formatTime(effectiveDuration)}
            </span>
          </div>
        </div>

        {/* Right: Lyrics, Queue, Volume */}
        <div className="flex items-center justify-end gap-1 sm:gap-1.5 sm:w-[220px] lg:w-[280px] shrink-0">
          <button
            type="button"
            disabled={!currentTrack || isAdActive}
            onClick={() => onOpenNowPlaying('lyrics')}
            aria-label={t.playerOpenLyricsAria}
            title={t.playerLyricsTitle}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 transition-colors"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={!currentTrack || isAdActive}
            onClick={() => onOpenNowPlaying('up-next')}
            aria-label={t.playerOpenQueueAria}
            title={t.playerUpNextTitle}
            className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 transition-colors"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          <div className="hidden md:flex items-center gap-1.5 ml-1">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? t.playerUnmuteAria : t.playerMuteAria}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              {muted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => onChangeVolume(Number(e.target.value))}
              aria-label={t.playerVolumeAria}
              className="w-20 h-1.5 accent-white cursor-pointer bg-white/[0.14] rounded-full"
            />
          </div>

          <button
            type="button"
            disabled={!currentTrack || isAdActive}
            onClick={() => onOpenNowPlaying('up-next')}
            aria-label={t.playerExpandAria}
            className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
