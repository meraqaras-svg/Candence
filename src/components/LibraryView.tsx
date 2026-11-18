import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Pause,
  Play,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import type { Playlist, Track } from '../types/music';
import { formatFileSize, formatTime } from '../utils/formatters';
import { useI18n } from '../utils/I18nContext';
import { CoverArt } from './CoverArt';
import { TrackActionMenu } from './TrackActionMenu';

export type LibrarySubTab = 'playlists' | 'favorites' | 'local';

interface LibraryViewProps {
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  initialSubTab?: LibrarySubTab;
  allTracksMap: Map<string, Track>;
  localTracks: Track[];
  favoriteTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  favoriteIds: Set<string>;
  onSelectPlaylist: (playlistId: string | null) => void;
  onPlayTrack: (track: Track, queueList?: Track[]) => void;
  onToggleFavorite: (trackId: string) => void;
  onOpenNewPlaylist: (seedTrack?: Track) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenLyrics: (track: Track) => void;
  onTriggerUpload: () => void;
  onUploadFiles: (files: FileList | File[]) => void;
  onDeleteLocalTrack: (trackId: string) => void;
}

export function LibraryView({
  playlists,
  selectedPlaylistId,
  initialSubTab = 'playlists',
  allTracksMap,
  localTracks,
  favoriteTracks,
  currentTrack,
  isPlaying,
  favoriteIds,
  onSelectPlaylist,
  onPlayTrack,
  onToggleFavorite,
  onOpenNewPlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
  onAddToPlaylist,
  onAddToQueue,
  onOpenLyrics,
  onTriggerUpload,
  onUploadFiles,
  onDeleteLocalTrack,
}: LibraryViewProps) {
  const { t } = useI18n();
  const [subTab, setSubTab] = useState<LibrarySubTab>(initialSubTab);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const selectedPlaylist = selectedPlaylistId
    ? playlists.find((p) => p.id === selectedPlaylistId) || null
    : null;

  if (selectedPlaylist) {
    const tracks = selectedPlaylist.trackIds
      .map((id) => allTracksMap.get(id))
      .filter((tr): tr is Track => Boolean(tr));
    const cover = selectedPlaylist.coverUrl || tracks.find((tr) => tr.coverUrl)?.coverUrl;
    const totalSeconds = tracks.reduce((sum, tr) => sum + (tr.duration || 0), 0);

    return (
      <div className="px-5 sm:px-8 pt-6 pb-12 max-w-[1280px] mx-auto space-y-6">
        <button
          type="button"
          onClick={() => onSelectPlaylist(null)}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.libraryBack}</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end gap-6">
          <div className="w-44 h-44 shrink-0">
            <CoverArt src={cover} alt={selectedPlaylist.name} size="lg" />
          </div>
          <div className="space-y-2 min-w-0">
            <p className="text-xs font-medium text-zinc-400">{t.libraryPlaylistLabel}</p>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white text-balance">
              {selectedPlaylist.name}
            </h1>
            <p className="text-sm text-zinc-300 max-w-xl">{selectedPlaylist.description}</p>
            <p className="text-xs text-zinc-400 tabular-nums">
              {t.songsCount(tracks.length)} · {formatTime(totalSeconds)} {t.libraryTotal}
            </p>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={tracks.length === 0}
                onClick={() => tracks[0] && onPlayTrack(tracks[0], tracks)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white transition-colors"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.libraryPlayAll}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePlaylist(selectedPlaylist.id);
                  onSelectPlaylist(null);
                }}
                aria-label={t.libraryDeletePlaylistAria(selectedPlaylist.name)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium liquid-glass-subtle hover:bg-rose-500/20 text-zinc-300 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.libraryDeletePlaylist}</span>
              </button>
            </div>
          </div>
        </div>

        {tracks.length === 0 ? (
          <div className="rounded-2xl liquid-glass-subtle p-8 text-center text-sm text-zinc-400">
            {t.libraryEmptyPlaylist}
          </div>
        ) : (
          <div className="rounded-2xl liquid-glass-subtle divide-y divide-white/[0.06]">
            {tracks.map((track, idx) => {
              const active = currentTrack?.id === track.id;
              const liked = favoriteIds.has(track.id);
              return (
                <div
                  key={track.id}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${
                    active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="w-5 text-xs text-zinc-500 tabular-nums text-right shrink-0">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPlayTrack(track, tracks)}
                      aria-label={
                        active && isPlaying ? t.pauseAria(track.title) : t.playAria(track.title)
                      }
                      className="shrink-0"
                    >
                      <CoverArt
                        src={track.coverUrl}
                        alt={track.title}
                        size="xs"
                        isPlaying={active && isPlaying}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onPlayTrack(track, tracks)}
                        className="text-sm font-medium text-white hover:underline truncate block text-left w-full"
                      >
                        {track.title}
                      </button>
                      <div className="text-xs text-zinc-400 truncate">
                        {track.artist} · {track.album}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(track.id)}
                      aria-label={
                        liked ? t.favRemoveAria(track.title) : t.favAddAria(track.title)
                      }
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        liked ? 'text-rose-400' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                    </button>
                    <span className="text-xs text-zinc-400 font-mono-tabular w-10 text-right">
                      {formatTime(track.duration)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveTrackFromPlaylist(selectedPlaylist.id, track.id)}
                      aria-label={t.libraryRemoveFromPlaylistAria(track.title, selectedPlaylist.name)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-white/[0.06] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 sm:px-8 pt-6 pb-12 max-w-[1280px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{t.libraryTitle}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSubTab('local');
              onTriggerUpload();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium liquid-glass-subtle hover:bg-white/[0.12] text-white transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{t.actionUploadAudio}</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenNewPlaylist()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.actionNewPlaylist}</span>
          </button>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div
        role="tablist"
        aria-label={t.libraryTitle}
        className="inline-flex items-center gap-1 p-1 rounded-xl liquid-glass-subtle"
      >
        {(
          [
            { id: 'playlists', label: t.libraryTabPlaylists(playlists.length) },
            { id: 'favorites', label: t.libraryTabFavorites(favoriteTracks.length) },
            { id: 'local', label: t.libraryTabLocal(localTracks.length) },
          ] as const
        ).map((tab) => {
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setSubTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                active ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {subTab === 'playlists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {playlists.map((pl) => {
            const cover =
              pl.coverUrl ||
              pl.trackIds.map((id) => allTracksMap.get(id)).find((tr) => tr?.coverUrl)?.coverUrl;
            return (
              <motion.button
                key={pl.id}
                type="button"
                whileHover={{ y: -3, scale: 1.012 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                onClick={() => onSelectPlaylist(pl.id)}
                className="group text-left rounded-2xl liquid-glass-subtle hover:bg-white/[0.07] p-3.5 transition-colors flex flex-col"
              >
                <div className="mb-3 overflow-hidden rounded-xl">
                  <CoverArt src={cover} alt={pl.name} size="lg" />
                </div>
                <div className="text-sm font-semibold text-white truncate w-full">{pl.name}</div>
                <div className="text-xs text-zinc-400 truncate mt-0.5 w-full">
                  {t.songsCount(pl.trackIds.length)} · {pl.description}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {subTab === 'favorites' &&
        (favoriteTracks.length === 0 ? (
          <div className="rounded-2xl liquid-glass-subtle p-8 text-center text-sm text-zinc-400">
            {t.libraryEmptyFavorites}
          </div>
        ) : (
          <div className="rounded-2xl liquid-glass-subtle divide-y divide-white/[0.06]">
            {favoriteTracks.map((track) => {
              const active = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onPlayTrack(track, favoriteTracks)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <CoverArt
                      src={track.coverUrl}
                      alt={track.title}
                      size="xs"
                      isPlaying={active && isPlaying}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{track.title}</div>
                      <div className="text-xs text-zinc-400 truncate">
                        {track.artist} · {track.album}
                      </div>
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(track.id)}
                      aria-label={t.favRemoveAria(track.title)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-400 hover:bg-white/[0.06]"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                    <span className="text-xs text-zinc-400 font-mono-tabular w-10 text-right">
                      {formatTime(track.duration)}
                    </span>
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
              );
            })}
          </div>
        ))}

      {subTab === 'local' && (
        <div className="space-y-4">
          {/* Sleek Local Audio Dropzone inside Library */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingFiles(true);
            }}
            onDragLeave={() => setIsDraggingFiles(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingFiles(false);
              if (e.dataTransfer.files?.length) {
                onUploadFiles(e.dataTransfer.files);
              }
            }}
            className={`rounded-2xl border border-dashed p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
              isDraggingFiles
                ? 'border-rose-400 bg-rose-500/10'
                : 'border-white/[0.14] liquid-glass-subtle'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-zinc-300 shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">{t.libraryDropTitle}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{t.libraryDropSubtitle}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onTriggerUpload}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
            >
              {t.libraryChooseFiles}
            </button>
          </div>

          {localTracks.length > 0 && (
            <div className="rounded-2xl liquid-glass-subtle divide-y divide-white/[0.06]">
              {localTracks.map((track) => {
                const active = currentTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => onPlayTrack(track, localTracks)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/[0.07] flex items-center justify-center text-white shrink-0">
                        {active && isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{track.title}</div>
                        <div className="text-xs text-zinc-400 truncate">
                          {track.artist}
                          {track.fileSize ? ` · ${formatFileSize(track.fileSize)}` : ''}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-zinc-400 font-mono-tabular">
                        {formatTime(track.duration)}
                      </span>
                      <TrackActionMenu
                        track={track}
                        playlists={playlists}
                        onAddToPlaylist={onAddToPlaylist}
                        onAddToQueue={onAddToQueue}
                        onOpenLyrics={onOpenLyrics}
                        onRequestNewPlaylist={(tr) => onOpenNewPlaylist(tr)}
                      />
                      <button
                        type="button"
                        onClick={() => onDeleteLocalTrack(track.id)}
                        aria-label={t.libraryRemoveLocalAria(track.title)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-rose-400 hover:bg-white/[0.06]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
