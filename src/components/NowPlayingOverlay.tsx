import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Edit3,
  Heart,
  Moon,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Save,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  X,
} from 'lucide-react';
import type { NowPlayingTab, RepeatMode, SleepTimerMinutes, Track } from '../types/music';
import { formatTime } from '../utils/formatters';
import { useI18n } from '../utils/I18nContext';
import { fetchFreeLyrics } from '../utils/itunesApi';
import {
  getActiveLyricIndex,
  hasSyncedTimestamps,
  parseLyrics,
} from '../utils/lyricsParser';
import { getAmbientPaletteForTrack } from '../utils/ambientColor';
import { CoverArt } from './CoverArt';

interface NowPlayingOverlayProps {
  open: boolean;
  activeTab: NowPlayingTab;
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isFavorite: boolean;
  customLyricsMap: Record<string, string>;
  sleepTimerMinutes: SleepTimerMinutes;
  sleepRemainingSec: number | null;
  onSelectSleepTimer: (minutes: SleepTimerMinutes) => void;
  onClose: () => void;
  onTabChange: (tab: NowPlayingTab) => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleFavorite: () => void;
  onPlayQueueTrack: (track: Track) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onSaveCustomLyrics: (trackId: string, lyrics: string) => void;
}

const SLEEP_OPTIONS: SleepTimerMinutes[] = [0, 15, 30, 60];

export function NowPlayingOverlay({
  open,
  activeTab,
  currentTrack,
  queue,
  isPlaying,
  currentTime,
  duration,
  shuffle,
  repeat,
  isFavorite,
  customLyricsMap,
  sleepTimerMinutes,
  sleepRemainingSec,
  onSelectSleepTimer,
  onClose,
  onTabChange,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onToggleShuffle,
  onCycleRepeat,
  onToggleFavorite,
  onPlayQueueTrack,
  onRemoveFromQueue,
  onSaveCustomLyrics,
}: NowPlayingOverlayProps) {
  const { language, t } = useI18n();
  const [fetchedLyrics, setFetchedLyrics] = useState<Record<string, string | null>>({});
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [lyricsDraft, setLyricsDraft] = useState('');
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const activeLineRef = useRef<HTMLButtonElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setShowSleepMenu(false);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSleepMenu) {
          setShowSleepMenu(false);
        } else if (isEditingLyrics) {
          setIsEditingLyrics(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, isEditingLyrics, showSleepMenu, onClose]);

  useEffect(() => {
    setIsEditingLyrics(false);
  }, [currentTrack?.id]);

  // Fetch free synced lyrics from LRCLIB when opening Lyrics tab
  useEffect(() => {
    if (!open || activeTab !== 'lyrics' || !currentTrack) return;
    const hasCustom = Boolean(customLyricsMap[currentTrack.id]);
    const hasBundled = Boolean(currentTrack.lyrics);
    if (hasCustom || hasBundled || currentTrack.id in fetchedLyrics) return;
    if (currentTrack.source === 'local') return;

    const controller = new AbortController();
    setLoadingLyrics(true);

    fetchFreeLyrics(currentTrack.artist, currentTrack.title, controller.signal)
      .then((text) => {
        if (!controller.signal.aborted) {
          setFetchedLyrics((prev) => ({ ...prev, [currentTrack.id]: text }));
          setLoadingLyrics(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFetchedLyrics((prev) => ({ ...prev, [currentTrack.id]: null }));
          setLoadingLyrics(false);
        }
      });

    return () => controller.abort();
  }, [open, activeTab, currentTrack, customLyricsMap, fetchedLyrics]);

  const rawLyrics = currentTrack
    ? customLyricsMap[currentTrack.id] ??
      currentTrack.lyrics ??
      fetchedLyrics[currentTrack.id] ??
      ''
    : '';

  const parsedLyrics = useMemo(() => parseLyrics(rawLyrics), [rawLyrics]);
  const isSynced = useMemo(() => hasSyncedTimestamps(parsedLyrics), [parsedLyrics]);
  const activeLyricIdx = useMemo(
    () => (isSynced ? getActiveLyricIndex(parsedLyrics, currentTime) : -1),
    [isSynced, parsedLyrics, currentTime]
  );

  useEffect(() => {
    if (open && activeTab === 'lyrics' && activeLyricIdx >= 0 && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [open, activeTab, activeLyricIdx]);

  const ambient = getAmbientPaletteForTrack(currentTrack);
  const effectiveDuration = duration > 0 ? duration : currentTrack?.duration || 0;
  const repeatLabel =
    language === 'tr'
      ? repeat === 'off'
        ? 'kapalı'
        : repeat === 'all'
          ? 'tümü'
          : 'tek'
      : repeat;

  const startEditLyrics = () => {
    setLyricsDraft(rawLyrics);
    setIsEditingLyrics(true);
  };

  const handleSaveLyrics = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTrack) return;
    onSaveCustomLyrics(currentTrack.id, lyricsDraft);
    setIsEditingLyrics(false);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && currentTrack && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={t.npDialogAria}
          initial={{ opacity: 0, y: 40, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 36, scale: 0.985 }}
          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          className="fixed inset-0 z-[95] bg-[#070709] text-white flex flex-col overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
        >
          {/* Dynamic Apple Music-style blurred album artwork & color-shifting ambient glow */}
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
            {currentTrack.coverUrl && (
              <motion.img
                key={currentTrack.coverUrl}
                initial={{ opacity: 0, scale: 1.35 }}
                animate={{ opacity: 0.45, scale: 1.25 }}
                transition={{ duration: 0.7 }}
                src={currentTrack.coverUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover blur-[95px] saturate-150"
              />
            )}
            <div
              className="absolute -top-28 -left-24 w-[520px] h-[520px] rounded-full blur-[130px] transition-colors duration-700"
              style={{ background: ambient.primary }}
            />
            <div
              className="absolute bottom-0 right-0 w-[460px] h-[460px] rounded-full blur-[130px] transition-colors duration-700"
              style={{ background: ambient.secondary }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/65 to-[#070709]/92" />
          </div>

          {/* Swipe-down gesture handle + Top Header */}
          <header
            onTouchStart={(e) => {
              touchStartYRef.current = e.touches[0]?.clientY ?? null;
            }}
            onTouchEnd={(e) => {
              const startY = touchStartYRef.current;
              const endY = e.changedTouches[0]?.clientY ?? null;
              if (startY !== null && endY !== null && endY - startY > 70) {
                onClose();
              }
              touchStartYRef.current = null;
            }}
            className="relative z-20 flex flex-col items-center px-4 sm:px-8 pt-2.5 pb-3 border-b border-white/[0.08] backdrop-blur-xl bg-black/20 select-none"
          >
            {/* Mobile Swipe-Down Pill Indicator */}
            <motion.button
              type="button"
              onClick={onClose}
              drag="y"
              dragConstraints={{ top: 0, bottom: 120 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 55 || info.velocity.y > 380) {
                  onClose();
                }
              }}
              aria-label={t.npSwipeHandleAria}
              className="w-12 h-4 flex items-center justify-center mb-1.5 cursor-grab active:cursor-grabbing"
            >
              <span className="w-10 h-1 rounded-full bg-white/30 hover:bg-white/55 transition-colors" />
            </motion.button>

            <div className="w-full flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                aria-label={t.npMinimizeAria}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium liquid-glass-subtle hover:bg-white/[0.15] text-zinc-100 transition-colors shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
                <span>{t.npMinimize}</span>
              </button>

              {/* Segmented Tab Switcher */}
              <div
                role="tablist"
                aria-label={t.npDialogAria}
                className="inline-flex items-center gap-1 p-1 rounded-xl liquid-glass-subtle"
              >
                <button
                  role="tab"
                  type="button"
                  aria-selected={activeTab === 'up-next'}
                  onClick={() => onTabChange('up-next')}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'up-next'
                      ? 'bg-white text-zinc-950 shadow-sm'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {t.npTabUpNext}
                </button>
                <button
                  role="tab"
                  type="button"
                  aria-selected={activeTab === 'lyrics'}
                  onClick={() => onTabChange('lyrics')}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === 'lyrics'
                      ? 'bg-white text-zinc-950 shadow-sm'
                      : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {t.npTabLyrics}
                </button>
              </div>

              {/* Sleep Timer Button + Popover */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSleepMenu((prev) => !prev)}
                  aria-label={t.npSleepTimer}
                  aria-expanded={showSleepMenu}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                    sleepTimerMinutes > 0
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                      : 'liquid-glass-subtle hover:bg-white/[0.15] text-zinc-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-mono-tabular">
                    {sleepTimerMinutes > 0 && sleepRemainingSec !== null
                      ? formatTime(sleepRemainingSec)
                      : t.npSleepShort}
                  </span>
                </button>

                {showSleepMenu && (
                  <div
                    role="menu"
                    aria-label={t.npSleepTimer}
                    className="absolute right-0 mt-2 w-44 rounded-2xl liquid-glass-modal p-1.5 shadow-2xl border border-white/[0.14] z-30"
                  >
                    <div className="px-2.5 py-1 text-[11px] font-medium text-zinc-400">
                      {t.npSleepTimer}
                    </div>
                    {SLEEP_OPTIONS.map((minutes) => {
                      const active = sleepTimerMinutes === minutes;
                      return (
                        <button
                          key={minutes}
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          onClick={() => {
                            onSelectSleepTimer(minutes);
                            setShowSleepMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                            active
                              ? 'bg-rose-500 text-white'
                              : 'text-zinc-200 hover:bg-white/[0.08]'
                          }`}
                        >
                          <span>{minutes === 0 ? t.off : t.npMinutes(minutes)}</span>
                          {active && <span className="text-[10px]">{t.active}</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Split Content */}
          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-5 sm:px-10 py-6 sm:py-10">
            <div className="max-w-5xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left: Artwork & Transport */}
              <div className="lg:col-span-5 flex flex-col items-center lg:items-start">
                <motion.div
                  key={currentTrack.id}
                  initial={{ opacity: 0.7, scale: 0.94 }}
                  animate={{ opacity: 1, scale: isPlaying ? 1 : 0.97 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <CoverArt
                    src={currentTrack.coverUrl}
                    alt={`${currentTrack.title} album art`}
                    size="xl"
                    className="shadow-2xl shadow-black/70 ring-1 ring-white/[0.15]"
                  />
                </motion.div>

                <div className="w-full max-w-xs sm:max-w-sm mt-6 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                      {currentTrack.title}
                    </h2>
                    <p className="text-sm text-zinc-300 truncate mt-0.5">
                      {currentTrack.artist} · {currentTrack.album}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    aria-label={
                      isFavorite
                        ? t.favRemoveAria(currentTrack.title)
                        : t.favAddAria(currentTrack.title)
                    }
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isFavorite
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'liquid-glass-subtle text-zinc-300 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Scrubber */}
                <div className="w-full max-w-xs sm:max-w-sm mt-5 space-y-1.5">
                  <input
                    type="range"
                    min={0}
                    max={effectiveDuration || 1}
                    step={0.1}
                    value={Math.min(currentTime, effectiveDuration || 1)}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    aria-label={t.playerSeekAria}
                    className="w-full h-1.5 accent-white cursor-pointer bg-white/[0.18] rounded-full"
                  />
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono-tabular">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(effectiveDuration)}</span>
                  </div>
                </div>

                {/* Transport Controls */}
                <div className="w-full max-w-xs sm:max-w-sm mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={onToggleShuffle}
                    aria-label={shuffle ? t.playerDisableShuffle : t.playerEnableShuffle}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      shuffle ? 'text-rose-400' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onPrev}
                    aria-label={t.playerPrevTrack}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/[0.1] transition-colors"
                  >
                    <SkipBack className="w-5 h-5 fill-current" />
                  </button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={onTogglePlay}
                    aria-label={isPlaying ? t.playerPause : t.playerPlay}
                    className="w-14 h-14 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={onNext}
                    aria-label={t.playerNextTrack}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/[0.1] transition-colors"
                  >
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={onCycleRepeat}
                    aria-label={t.playerRepeatAria(repeatLabel)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
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
              </div>

              {/* Right: Lyrics or Up Next */}
              <div className="lg:col-span-7 h-full max-h-[540px] flex flex-col rounded-2xl liquid-glass p-5 sm:p-7">
                <AnimatePresence mode="wait" initial={false}>
                  {activeTab === 'lyrics' ? (
                    <motion.div
                      key="lyrics-tab"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col h-full min-h-[320px]"
                    >
                      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.08]">
                        <div>
                          <h3 className="text-base font-semibold text-white">{t.npTabLyrics}</h3>
                          <p className="text-xs text-zinc-400">
                            {isSynced ? t.npSyncedSubtitle : t.npTabLyrics}
                          </p>
                        </div>

                        {!isEditingLyrics && (
                          <button
                            type="button"
                            onClick={startEditLyrics}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.08] hover:bg-white/[0.14] text-zinc-100 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{rawLyrics ? t.npEditLyrics : t.npAddLyrics}</span>
                          </button>
                        )}
                      </div>

                      {isEditingLyrics ? (
                        <form onSubmit={handleSaveLyrics} className="flex-1 flex flex-col gap-3">
                          <label htmlFor="lyrics-editor" className="text-xs text-zinc-300">
                            {t.npLyricsEditorHint}
                          </label>
                          <textarea
                            id="lyrics-editor"
                            value={lyricsDraft}
                            onChange={(e) => setLyricsDraft(e.target.value)}
                            rows={10}
                            placeholder={t.npLyricsPlaceholder}
                            className="flex-1 w-full rounded-xl bg-white/[0.06] border border-white/[0.12] p-3.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/70 resize-none"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingLyrics(false)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1]"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>{t.cancel}</span>
                            </button>
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{t.npSaveLyrics}</span>
                            </button>
                          </div>
                        </form>
                      ) : loadingLyrics ? (
                        <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
                          {t.npFetchingLyrics}
                        </div>
                      ) : parsedLyrics.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-3">
                          <p className="text-sm text-zinc-300">
                            {t.npNoLyricsForTrack(currentTrack.title)}
                          </p>
                          <button
                            type="button"
                            onClick={startEditLyrics}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{t.npAddCustomLyrics}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3.5">
                          {parsedLyrics.map((line, idx) => {
                            if (!line.text) {
                              return <div key={idx} className="h-3" />;
                            }
                            const isActive = isSynced && idx === activeLyricIdx;
                            const isPast = isSynced && activeLyricIdx > idx;

                            if (line.time !== null) {
                              return (
                                <button
                                  key={idx}
                                  ref={isActive ? activeLineRef : undefined}
                                  type="button"
                                  onClick={() => onSeek(line.time!)}
                                  className={`block w-full text-left font-display text-lg sm:text-2xl font-semibold leading-snug transition-all duration-300 origin-left ${
                                    isActive
                                      ? 'text-white scale-[1.02] drop-shadow-[0_0_18px_rgba(255,255,255,0.45)]'
                                      : isPast
                                        ? 'text-zinc-500/80 hover:text-zinc-300'
                                        : 'text-zinc-300/80 hover:text-white'
                                  }`}
                                >
                                  {line.text}
                                </button>
                              );
                            }

                            return (
                              <p
                                key={idx}
                                className="font-display text-lg sm:text-xl font-medium leading-relaxed text-zinc-200"
                              >
                                {line.text}
                              </p>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="up-next-tab"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col h-full min-h-[320px]"
                    >
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
                        <h3 className="text-base font-semibold text-white">{t.npTabUpNext}</h3>
                        <span className="text-xs text-zinc-400 tabular-nums">
                          {t.songsCount(queue.length)}
                        </span>
                      </div>

                      {queue.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">
                          {t.npQueueEmpty}
                        </div>
                      ) : (
                        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                          {queue.map((track) => {
                            const active = track.id === currentTrack.id;
                            return (
                              <div
                                key={track.id}
                                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-colors ${
                                  active
                                    ? 'bg-white/[0.12] border border-white/[0.12]'
                                    : 'hover:bg-white/[0.06]'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => onPlayQueueTrack(track)}
                                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                                >
                                  <CoverArt
                                    src={track.coverUrl}
                                    alt={track.title}
                                    size="xs"
                                    isPlaying={active && isPlaying}
                                  />
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-white truncate">
                                      {track.title}
                                    </div>
                                    <div className="text-xs text-zinc-400 truncate">
                                      {track.artist}
                                    </div>
                                  </div>
                                </button>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs text-zinc-400 font-mono-tabular">
                                    {formatTime(track.duration)}
                                  </span>
                                  {!active && (
                                    <button
                                      type="button"
                                      onClick={() => onRemoveFromQueue(track.id)}
                                      aria-label={t.npRemoveFromQueueAria(track.title)}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-white/[0.06]"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
