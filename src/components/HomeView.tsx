import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  GripVertical,
  Heart,
  Link2,
  Palette,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type {
  HomeWidgetConfig,
  HomeWidgetId,
  LayoutDensity,
  Playlist,
  Track,
} from '../types/music';
import { formatTime } from '../utils/formatters';
import { getLocalizedGreeting, getLocalizedWidgetLabel } from '../utils/i18n';
import { useI18n } from '../utils/I18nContext';
import {
  DEFAULT_HOME_LAYOUT,
  moveWidget,
  reorderWidgets,
  toggleWidgetVisibility,
} from '../utils/layoutManager';
import { CoverArt } from './CoverArt';
import { TrackActionMenu } from './TrackActionMenu';

interface HomeViewProps {
  homeLayout: HomeWidgetConfig[];
  layoutDensity?: LayoutDensity;
  recentTracks: Track[];
  quickPicks: Track[];
  playlists: Playlist[];
  allTracksMap: Map<string, Track>;
  currentTrack: Track | null;
  isPlaying: boolean;
  favoriteIds: Set<string>;
  onPlayTrack: (track: Track, queueList?: Track[]) => void;
  onToggleFavorite: (trackId: string) => void;
  onSaveHomeLayout: (nextLayout: HomeWidgetConfig[]) => void;
  onOpenPlaylist: (playlistId: string) => void;
  onOpenNewPlaylist: (seedTrack?: Track) => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenLyrics: (track: Track) => void;
  onOpenLinkImport: () => void;
  onOpenThemeCustomizer?: () => void;
}

export function HomeView({
  homeLayout,
  layoutDensity = 'comfortable',
  recentTracks,
  quickPicks,
  playlists,
  allTracksMap,
  currentTrack,
  isPlaying,
  favoriteIds,
  onPlayTrack,
  onToggleFavorite,
  onSaveHomeLayout,
  onOpenPlaylist,
  onOpenNewPlaylist,
  onAddToPlaylist,
  onAddToQueue,
  onOpenLyrics,
  onOpenLinkImport,
  onOpenThemeCustomizer,
}: HomeViewProps) {
  const { language, t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [draftLayout, setDraftLayout] = useState<HomeWidgetConfig[]>(homeLayout);
  const [draggedId, setDraggedId] = useState<HomeWidgetId | null>(null);

  const isCompact = layoutDensity === 'compact';
  const greeting = getLocalizedGreeting(new Date().getHours(), language);
  const activeLayout = isEditing ? draftLayout : homeLayout;
  const visibleSections = isEditing ? activeLayout : activeLayout.filter((w) => w.visible);

  const enterEditMode = () => {
    setDraftLayout(homeLayout.map((w) => ({ ...w })));
    setIsEditing(true);
  };

  const handleSave = () => {
    onSaveHomeLayout(draftLayout);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftLayout(homeLayout.map((w) => ({ ...w })));
    setIsEditing(false);
  };

  const handleReset = () => {
    setDraftLayout(DEFAULT_HOME_LAYOUT.map((w) => ({ ...w })));
  };

  const handleDropWidget = (targetId: HomeWidgetId) => {
    if (!draggedId || draggedId === targetId) return;
    const fromIdx = draftLayout.findIndex((w) => w.id === draggedId);
    const toIdx = draftLayout.findIndex((w) => w.id === targetId);
    if (fromIdx !== -1 && toIdx !== -1) {
      setDraftLayout((prev) => reorderWidgets(prev, fromIdx, toIdx));
    }
    setDraggedId(null);
  };

  const renderSectionBody = (id: HomeWidgetId) => {
    switch (id) {
      case 'recently-played': {
        if (recentTracks.length === 0) {
          return (
            <div className="rounded-2xl liquid-glass-subtle p-6 text-sm text-zinc-400">
              {t.homeRecentEmpty}
            </div>
          );
        }
        return (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${
              isCompact ? 'gap-2' : 'gap-3'
            }`}
          >
            {recentTracks.slice(0, 8).map((track) => {
              const active = currentTrack?.id === track.id;
              return (
                <motion.div
                  key={track.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  className={`group flex items-center gap-3 ${
                    isCompact ? 'p-2' : 'p-2.5'
                  } rounded-xl transition-colors ${
                    active
                      ? 'liquid-glass ring-1 ring-rose-500/35'
                      : 'liquid-glass-subtle hover:bg-white/[0.08]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onPlayTrack(track, recentTracks)}
                    aria-label={
                      active && isPlaying ? t.pauseAria(track.title) : t.playAria(track.title)
                    }
                    className="relative flex items-center gap-3 flex-1 min-w-0 text-left focus-visible:outline-2 focus-visible:outline-rose-500 rounded-lg"
                  >
                    <CoverArt
                      src={track.coverUrl}
                      alt={track.title}
                      size="sm"
                      isPlaying={active && isPlaying}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white truncate">{track.title}</div>
                      <div className="text-xs text-zinc-400 truncate">{track.artist}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPlayTrack(track, recentTracks)}
                    aria-label={
                      active && isPlaying ? t.pauseAria(track.title) : t.playAria(track.title)
                    }
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-opacity ${
                      active
                        ? 'bg-rose-500 text-white opacity-100'
                        : 'bg-white text-zinc-950 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                    }`}
                  >
                    {active && isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        );
      }

      case 'quick-picks': {
        return (
          <div
            className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 ${
              isCompact ? 'gap-2.5' : 'gap-4'
            }`}
          >
            {quickPicks.map((track) => {
              const active = currentTrack?.id === track.id;
              const liked = favoriteIds.has(track.id);
              return (
                <motion.div
                  key={track.id}
                  whileHover={{ y: -3, scale: 1.012 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className={`group rounded-2xl ${
                    isCompact ? 'p-2.5' : 'p-3.5'
                  } transition-colors flex flex-col ${
                    active
                      ? 'liquid-glass ring-1 ring-rose-500/35'
                      : 'liquid-glass-subtle hover:bg-white/[0.07]'
                  }`}
                >
                  <div className="relative mb-2.5 sm:mb-3">
                    <button
                      type="button"
                      onClick={() => onPlayTrack(track, quickPicks)}
                      aria-label={
                        active && isPlaying ? t.pauseAria(track.title) : t.playAria(track.title)
                      }
                      className="block w-full rounded-xl overflow-hidden focus-visible:outline-2 focus-visible:outline-rose-500"
                    >
                      <CoverArt
                        src={track.coverUrl}
                        alt={track.title}
                        size="lg"
                        isPlaying={active && isPlaying}
                        className="group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => onPlayTrack(track, quickPicks)}
                      aria-label={
                        active && isPlaying ? t.pauseAria(track.title) : t.playAria(track.title)
                      }
                      className={`absolute bottom-2.5 right-2.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 ${
                        active
                          ? 'bg-rose-500 text-white opacity-100 translate-y-0'
                          : 'bg-white text-zinc-950 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 focus-visible:opacity-100'
                      }`}
                    >
                      {active && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => onPlayTrack(track, quickPicks)}
                      className="text-sm font-semibold text-white hover:underline truncate block text-left w-full"
                    >
                      {track.title}
                    </button>

                    <div className="flex items-center justify-between gap-1.5">
                      <div className="text-xs text-zinc-400 truncate min-w-0">
                        {track.artist} · <span className="tabular-nums">{formatTime(track.duration)}</span>
                      </div>

                      <div className="flex items-center shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(track.id)}
                          aria-label={
                            liked ? t.favRemoveAria(track.title) : t.favAddAria(track.title)
                          }
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            liked ? 'text-rose-400' : 'text-zinc-500 hover:text-white'
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                        </button>
                        <TrackActionMenu
                          track={track}
                          playlists={playlists}
                          onAddToPlaylist={onAddToPlaylist}
                          onAddToQueue={onAddToQueue}
                          onOpenLyrics={onOpenLyrics}
                          onRequestNewPlaylist={(tr) => onOpenNewPlaylist(tr)}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        );
      }

      case 'playlists': {
        return (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${
              isCompact ? 'gap-2.5' : 'gap-4'
            }`}
          >
            {playlists.map((pl) => {
              const firstTrack = pl.trackIds
                .map((tid) => allTracksMap.get(tid))
                .find((tr) => Boolean(tr?.coverUrl));
              const cover = pl.coverUrl || firstTrack?.coverUrl;
              return (
                <motion.button
                  key={pl.id}
                  type="button"
                  whileHover={{ y: -3, scale: 1.012 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  onClick={() => onOpenPlaylist(pl.id)}
                  className={`group text-left rounded-2xl liquid-glass-subtle hover:bg-white/[0.07] ${
                    isCompact ? 'p-2.5' : 'p-3.5'
                  } transition-colors flex flex-col focus-visible:outline-2 focus-visible:outline-rose-500`}
                >
                  <div className="mb-3 overflow-hidden rounded-xl">
                    <CoverArt
                      src={cover}
                      alt={pl.name}
                      size="lg"
                      className="group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                  <div className="text-sm font-semibold text-white truncate w-full">{pl.name}</div>
                  <div className="mt-0.5 text-xs text-zinc-400 truncate w-full">
                    {t.songsCount(pl.trackIds.length)} · {pl.description}
                  </div>
                </motion.button>
              );
            })}

            <button
              type="button"
              onClick={() => onOpenNewPlaylist()}
              className="rounded-2xl border border-dashed border-white/[0.14] hover:border-white/[0.28] liquid-glass-subtle hover:bg-white/[0.06] p-4 flex flex-col items-center justify-center gap-2.5 text-zinc-400 hover:text-white transition-colors min-h-[180px]"
            >
              <div className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{t.homeCreatePlaylist}</span>
            </button>
          </div>
        );
      }
    }
  };

  return (
    <div
      data-density={layoutDensity}
      className={`px-4 sm:px-8 ${
        isCompact ? 'pt-4 pb-8 space-y-6' : 'pt-6 pb-12 space-y-8'
      } max-w-[1280px] mx-auto`}
    >
      {/* Ultra-Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
          {greeting}
        </h1>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={onOpenLinkImport}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 hover:text-white transition-colors whitespace-nowrap shrink-0 backdrop-blur-xl"
              >
                <Link2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{t.actionLinkImport}</span>
              </button>
              {onOpenThemeCustomizer && (
                <button
                  type="button"
                  onClick={onOpenThemeCustomizer}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold liquid-glass-subtle hover:bg-white/[0.14] text-white transition-colors whitespace-nowrap shrink-0"
                >
                  <Palette className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.actionCustomizeTheme}</span>
                </button>
              )}
              <button
                type="button"
                onClick={enterEditMode}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold liquid-glass-subtle hover:bg-white/[0.14] text-white transition-colors whitespace-nowrap shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{t.homeCustomizeButton}</span>
              </button>
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white liquid-glass-subtle hover:bg-white/[0.1] transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.reset}</span>
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white liquid-glass-subtle hover:bg-white/[0.1] transition-colors whitespace-nowrap shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t.cancel}</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t.homeSaveLayout}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditing && (
        <div
          role="region"
          aria-label={t.homeCustomizeButton}
          className="rounded-2xl bg-rose-500/10 border border-rose-500/25 px-4 py-3 text-xs sm:text-sm text-zinc-200 flex items-center justify-between gap-4 backdrop-blur-xl"
        >
          <span>
            {t.homeEditInstructionsPre}
            <strong className="text-white font-semibold">{t.homeSaveLayout}</strong>
            {t.homeEditInstructionsEnd}
          </span>
        </div>
      )}

      {/* Empty state if all widgets hidden */}
      {!isEditing && visibleSections.length === 0 ? (
        <div className="rounded-2xl liquid-glass-subtle p-10 text-center space-y-3">
          <h2 className="text-lg font-semibold text-white">{t.homeHiddenTitle}</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">{t.homeHiddenBody}</p>
          <button
            type="button"
            onClick={enterEditMode}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t.homeCustomizeButton}</span>
          </button>
        </div>
      ) : (
        <div className={isCompact ? 'space-y-6' : 'space-y-8'} data-testid="home-sections-list">
          {visibleSections.map((widget, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === visibleSections.length - 1;
            const dimmed = isEditing && !widget.visible;
            const widgetLabel = getLocalizedWidgetLabel(widget.id, language);

            return (
              <section
                key={widget.id}
                data-widget-id={widget.id}
                aria-label={widgetLabel}
                draggable={isEditing}
                onDragStart={() => setDraggedId(widget.id)}
                onDragOver={(e) => {
                  if (isEditing) e.preventDefault();
                }}
                onDrop={() => {
                  if (isEditing) handleDropWidget(widget.id);
                }}
                onDragEnd={() => setDraggedId(null)}
                className={`transition-opacity duration-200 ${
                  isEditing ? 'rounded-2xl liquid-glass p-4' : ''
                } ${dimmed ? 'opacity-50' : 'opacity-100'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2.5">
                    {isEditing && (
                      <span
                        aria-hidden="true"
                        className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300"
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>
                    )}
                    <h2 className="text-lg font-semibold tracking-tight text-white">
                      {widgetLabel}
                    </h2>
                    {isEditing && (
                      <span className="text-xs text-zinc-400">
                        · {widget.visible ? t.homeVisible : t.homeHidden}
                      </span>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() =>
                          setDraftLayout((prev) => moveWidget(prev, widget.id, 'up'))
                        }
                        aria-label={t.homeMoveUpAria(widgetLabel)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:pointer-events-none text-zinc-200 transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() =>
                          setDraftLayout((prev) => moveWidget(prev, widget.id, 'down'))
                        }
                        aria-label={t.homeMoveDownAria(widgetLabel)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:pointer-events-none text-zinc-200 transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftLayout((prev) => toggleWidgetVisibility(prev, widget.id))
                        }
                        aria-label={
                          widget.visible
                            ? t.homeHideWidgetAria(widgetLabel)
                            : t.homeShowWidgetAria(widgetLabel)
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                          widget.visible
                            ? 'bg-white/[0.08] hover:bg-white/[0.14] text-white'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {widget.visible ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.homeShown}</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>{t.homeHidden}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {renderSectionBody(widget.id)}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
