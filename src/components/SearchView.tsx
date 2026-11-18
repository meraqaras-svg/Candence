import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Link2,
  Pause,
  Play,
  RefreshCw,
  Search as SearchIcon,
  X,
} from 'lucide-react';
import type { Playlist, Track } from '../types/music';
import { SUGGESTED_SEARCHES } from '../data/seedLibrary';
import { formatTime } from '../utils/formatters';
import { useI18n } from '../utils/I18nContext';
import { searchYouTubeWithCache } from '../utils/youtubeAndOembed';
import { CoverArt } from './CoverArt';
import { TrackActionMenu } from './TrackActionMenu';

interface SearchViewProps {
  youtubeApiKey: string;
  localAndCuratedTracks: Track[];
  playlists: Playlist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  favoriteIds: Set<string>;
  onPlayTrack: (track: Track, queueList?: Track[]) => void;
  onToggleFavorite: (trackId: string) => void;
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenLyrics: (track: Track) => void;
  onOpenNewPlaylist: (seedTrack?: Track) => void;
  onCacheTracks: (tracks: Track[]) => void;
  onOpenLinkImport: () => void;
  onSearchCacheUpdated: () => void;
}

export function SearchView({
  youtubeApiKey,
  localAndCuratedTracks,
  playlists,
  currentTrack,
  isPlaying,
  favoriteIds,
  onPlayTrack,
  onToggleFavorite,
  onAddToPlaylist,
  onAddToQueue,
  onOpenLyrics,
  onOpenNewPlaylist,
  onCacheTracks,
  onOpenLinkImport,
  onSearchCacheUpdated,
}: SearchViewProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = async (term: string) => {
    const clean = term.trim();
    setSubmittedQuery(clean);

    if (!clean) {
      setSearchResults([]);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setHasError(false);

    try {
      const response = await searchYouTubeWithCache(clean, youtubeApiKey, controller.signal);
      if (!controller.signal.aborted) {
        setSearchResults(response.tracks);
        if (response.tracks.length > 0) {
          onCacheTracks(response.tracks);
          onSearchCacheUpdated();
        }
        setIsLoading(false);
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setHasError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleQuickTerm = (term: string) => {
    setQuery(term);
    runSearch(term);
  };

  const matchingLibraryTracks = submittedQuery
    ? localAndCuratedTracks.filter((tr) => {
        const q = submittedQuery.toLowerCase();
        return (
          tr.title.toLowerCase().includes(q) ||
          tr.artist.toLowerCase().includes(q) ||
          tr.album.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div className="px-5 sm:px-8 pt-6 pb-12 max-w-[1280px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{t.searchTitle}</h1>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenLinkImport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium liquid-glass-subtle hover:bg-white/[0.12] text-zinc-200 hover:text-white transition-colors whitespace-nowrap"
          >
            <Link2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{t.actionLinkImport}</span>
          </button>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2.5 max-w-2xl">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchInputAria}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl liquid-glass-subtle text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/70"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSubmittedQuery('');
                setSearchResults([]);
                setHasError(false);
              }}
              aria-label={t.searchClearAria}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors whitespace-nowrap shrink-0"
        >
          {t.searchButton}
        </button>
      </form>

      {/* Suggested Search Tabs */}
      <div className="flex flex-wrap items-center gap-2" aria-label={t.searchTrending}>
        <span className="text-xs text-zinc-500 mr-1">{t.searchTrending}</span>
        {SUGGESTED_SEARCHES.map((term) => {
          const isCurrent = submittedQuery.toLowerCase() === term.toLowerCase();
          return (
            <button
              key={term}
              type="button"
              onClick={() => handleQuickTerm(term)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                isCurrent
                  ? 'bg-white text-zinc-950'
                  : 'liquid-glass-subtle hover:bg-white/[0.12] text-zinc-200'
              }`}
            >
              {term}
            </button>
          );
        })}
      </div>

      {/* Empty Initial State */}
      {!submittedQuery && !isLoading && (
        <div className="rounded-2xl liquid-glass-subtle p-8 text-center space-y-2">
          <SearchIcon className="w-7 h-7 text-zinc-500 mx-auto mb-2" />
          <h2 className="text-base font-semibold text-white">{t.searchDiscoverTitle}</h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">{t.searchDiscoverBody}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label={t.searchBusyAria}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3.5 p-3 rounded-xl liquid-glass-subtle animate-pulse"
            >
              <div className="w-12 h-12 rounded-lg bg-white/[0.08] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-48 bg-white/[0.08] rounded" />
                <div className="h-3 w-32 bg-white/[0.06] rounded" />
              </div>
              <div className="h-3 w-10 bg-white/[0.06] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/25 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-rose-200">{t.searchError}</div>
          <button
            type="button"
            onClick={() => runSearch(submittedQuery)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.retry}</span>
          </button>
        </div>
      )}

      {/* Local / Library Matches */}
      {!isLoading && matchingLibraryTracks.length > 0 && (
        <section className="space-y-3" aria-label={t.searchInLibrary}>
          <h2 className="text-sm font-semibold text-zinc-300">{t.searchInLibrary}</h2>
          <div className="rounded-2xl liquid-glass-subtle divide-y divide-white/[0.06]">
            {matchingLibraryTracks.map((track) => {
              const active = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onPlayTrack(track, matchingLibraryTracks)}
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
                  <span className="text-xs text-zinc-400 font-mono-tabular">
                    {formatTime(track.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Search Results */}
      {!isLoading && !hasError && submittedQuery && (
        <section className="space-y-3" aria-label={t.searchTopResults(submittedQuery)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-300">
              {t.searchTopResults(submittedQuery)}
            </h2>
            <span className="text-xs text-zinc-400 tabular-nums">
              {t.songsCount(searchResults.length)}
            </span>
          </div>

          {searchResults.length === 0 ? (
            <div className="rounded-2xl liquid-glass-subtle p-8 text-center text-sm text-zinc-400">
              {t.searchNoMatches(submittedQuery)}
            </div>
          ) : (
            <div className="rounded-2xl liquid-glass-subtle divide-y divide-white/[0.06] overflow-visible">
              {searchResults.map((track) => {
                const active = currentTrack?.id === track.id;
                const liked = favoriteIds.has(track.id);
                return (
                  <motion.div
                    key={track.id}
                    whileHover={{ x: 2 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className={`group flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${
                      active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onPlayTrack(track, searchResults)}
                        aria-label={
                          active && isPlaying ? t.pauseAria(track.title) : t.playAria(track.title)
                        }
                        className="relative shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-rose-500"
                      >
                        <CoverArt
                          src={track.coverUrl}
                          alt={track.title}
                          size="sm"
                          isPlaying={active && isPlaying}
                        />
                        {!active && (
                          <span className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </span>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onPlayTrack(track, searchResults)}
                          className="text-sm font-medium text-white hover:underline truncate block text-left w-full"
                        >
                          {track.title}
                        </button>
                        <div className="text-xs text-zinc-400 truncate mt-0.5">
                          {track.artist} · {track.album}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onPlayTrack(track, searchResults)}
                        aria-label={
                          active && isPlaying ? t.pauseAria(track.title) : t.playAria(track.title)
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                      >
                        {active && isPlaying ? (
                          <Pause className="w-4 h-4 fill-current text-rose-400" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(track.id)}
                        aria-label={
                          liked ? t.favRemoveAria(track.title) : t.favAddAria(track.title)
                        }
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          liked ? 'text-rose-400' : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                      </button>
                      <span className="hidden sm:inline text-xs text-zinc-400 font-mono-tabular w-11 text-right">
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
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
