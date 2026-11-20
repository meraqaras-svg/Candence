import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  FileSpreadsheet,
  Link2,
  ListMusic,
  Loader2,
  Play,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type { Track } from '../types/music';
import { useI18n } from '../utils/I18nContext';
import {
  MAX_PLAYLIST_IMPORT_TRACKS,
  SAMPLE_IMPORT_LINKS,
  matchTracklistToYouTube,
  parseMusicLink,
  parseTracklistText,
  resolveLinkAndImport,
  resolveSpotifyPlaylistUrl,
} from '../utils/youtubeAndOembed';
import { CoverArt } from './CoverArt';
import { AnimatedTabIndicator, NYXON_SPRING } from './MotionPrimitives';

export type ImportModalTab = 'single' | 'playlist';

interface LinkImportModalProps {
  open: boolean;
  initialTab?: ImportModalTab;
  youtubeApiKey: string;
  importedTracks: Track[];
  onClose: () => void;
  onImportAndPlay: (track: Track) => void;
  onImportPlaylist: (name: string, tracks: Track[], coverUrl?: string) => void;
}

export function LinkImportModal({
  open,
  initialTab = 'single',
  youtubeApiKey,
  importedTracks,
  onClose,
  onImportAndPlay,
  onImportPlaylist,
}: LinkImportModalProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ImportModalTab>(initialTab);

  // Single link state
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedTrack, setResolvedTrack] = useState<Track | null>(null);

  // Multi-track Playlist Importer state
  const [playlistUrlInput, setPlaylistUrlInput] = useState('');
  const [playlistName, setPlaylistName] = useState('');
  const [playlistCover, setPlaylistCover] = useState<string | undefined>(undefined);
  const [tracklistText, setTracklistText] = useState('');
  const [spotifyLoadedCount, setSpotifyLoadedCount] = useState<number | null>(null);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [isFetchingEmbed, setIsFetchingEmbed] = useState(false);
  const [isMatchingTracks, setIsMatchingTracks] = useState(false);
  const [matchProgress, setMatchProgress] = useState<{ done: number; total: number } | null>(
    null
  );

  const abortRef = useRef<AbortController | null>(null);
  const lastAutoFetchedUrlRef = useRef<string>('');
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setUrlInput('');
      setError(null);
      setResolvedTrack(null);
      setIsLoading(false);

      setPlaylistUrlInput('');
      setPlaylistName('');
      setPlaylistCover(undefined);
      setTracklistText('');
      setSpotifyLoadedCount(null);
      setPlaylistError(null);
      setIsFetchingEmbed(false);
      setIsMatchingTracks(false);
      setMatchProgress(null);
      lastAutoFetchedUrlRef.current = '';
    } else {
      abortRef.current?.abort();
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleResolveSingleUrl = async (targetUrl: string, autoPlayAfter = true) => {
    const clean = targetUrl.trim();
    if (!clean) {
      setError(t.importSingleUrlErrorEmpty);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const { track } = await resolveLinkAndImport(clean, youtubeApiKey, controller.signal);
      if (controller.signal.aborted) return;
      setResolvedTrack(track);
      setIsLoading(false);
      if (autoPlayAfter) {
        onImportAndPlay(track);
        onClose();
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setError(t.importSingleUrlErrorInvalid);
      setIsLoading(false);
    }
  };

  const handleFetchSpotifyPlaylistUrl = async (targetUrl?: string) => {
    const clean = (targetUrl ?? playlistUrlInput).trim();
    if (!clean) {
      setPlaylistError(t.importSpotifyUrlError);
      return;
    }

    lastAutoFetchedUrlRef.current = clean;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsFetchingEmbed(true);
    setPlaylistError(null);
    setSpotifyLoadedCount(null);

    try {
      const result = await resolveSpotifyPlaylistUrl(clean, controller.signal);
      if (controller.signal.aborted) return;

      if (result.playlistTitle) {
        setPlaylistName(result.playlistTitle);
      }
      setPlaylistCover(result.coverUrl);

      if (result.trackLines.length > 0) {
        setTracklistText(
          result.trackLines.map((l) => `${l.artist} - ${l.title}`).join('\n')
        );
        setSpotifyLoadedCount(result.trackLines.length);
      } else {
        setTracklistText('');
        setPlaylistError(t.importSpotifyParseError);
      }
      setIsFetchingEmbed(false);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setTracklistText('');
      setPlaylistError(t.importSpotifyParseError);
      setIsFetchingEmbed(false);
    }
  };

  const handlePlaylistUrlChange = (nextValue: string) => {
    setPlaylistUrlInput(nextValue);
    if (playlistError) setPlaylistError(null);
    if (spotifyLoadedCount !== null) setSpotifyLoadedCount(null);

    const trimmed = nextValue.trim();
    const parsed = parseMusicLink(trimmed);
    if (
      parsed &&
      parsed.provider === 'spotify' &&
      parsed.kind === 'playlist' &&
      parsed.spotifyId &&
      trimmed !== lastAutoFetchedUrlRef.current
    ) {
      void handleFetchSpotifyPlaylistUrl(trimmed);
    }
  };

  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseTracklistText(text);
      if (parsed.length === 0) {
        setPlaylistError(t.importCsvEmptyError);
        return;
      }

      setTracklistText(parsed.map((l) => `${l.artist} - ${l.title}`).join('\n'));
      setPlaylistError(null);
      setSpotifyLoadedCount(null);
      if (!playlistName.trim()) {
        const cleanFileName = file.name.replace(/\.(csv|txt)$/i, '').replace(/[_-]+/g, ' ').trim();
        if (cleanFileName) setPlaylistName(cleanFileName);
      }
    } catch {
      setPlaylistError(t.importCsvEmptyError);
    }
  };

  const handleImportMultiTrackPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlaylistError(null);

    let lines = parseTracklistText(tracklistText);
    let finalName = playlistName.trim();
    let finalCover = playlistCover;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (lines.length === 0 && playlistUrlInput.trim()) {
      setIsFetchingEmbed(true);
      try {
        const res = await resolveSpotifyPlaylistUrl(
          playlistUrlInput.trim(),
          controller.signal
        );
        lines = res.trackLines;
        if (!finalName && res.playlistTitle) finalName = res.playlistTitle;
        if (!finalCover) finalCover = res.coverUrl;
        if (lines.length > 0) {
          setTracklistText(lines.map((l) => `${l.artist} - ${l.title}`).join('\n'));
          setSpotifyLoadedCount(lines.length);
        } else {
          setTracklistText('');
          setIsFetchingEmbed(false);
          setPlaylistError(t.importSpotifyParseError);
          return;
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        setTracklistText('');
        setIsFetchingEmbed(false);
        setPlaylistError(t.importSpotifyParseError);
        return;
      }
      setIsFetchingEmbed(false);
    }

    if (lines.length === 0) {
      setPlaylistError(t.importPlaylistEmptyError);
      return;
    }

    setIsMatchingTracks(true);
    setMatchProgress({ done: 0, total: Math.min(MAX_PLAYLIST_IMPORT_TRACKS, lines.length) });

    try {
      const matchedTracks = await matchTracklistToYouTube(
        lines,
        youtubeApiKey,
        (done, total) => setMatchProgress({ done, total }),
        controller.signal
      );

      if (controller.signal.aborted) return;
      setIsMatchingTracks(false);

      const resolvedPlaylistName = finalName || t.importPlaylistNamePlaceholder;
      onImportPlaylist(
        resolvedPlaylistName,
        matchedTracks,
        finalCover || matchedTracks[0]?.coverUrl
      );
      onClose();
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setIsMatchingTracks(false);
      setPlaylistError(t.importPlaylistMatchError);
    }
  };

  const parsedLineCount = parseTracklistText(tracklistText).length;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="link-import-modal-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={NYXON_SPRING}
            className="w-full max-w-xl max-h-[85dvh] overflow-y-auto rounded-2xl liquid-glass-modal backdrop-blur-2xl border border-white/[0.12] p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="link-import-modal-title" className="text-lg font-semibold text-white">
                    {t.importModalTitle}
                  </h2>
                  <p className="text-xs text-zinc-400">{t.importModalSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.importModalCloseAria}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Mode Switcher: Single Link vs Playlist Import */}
            <div
              role="tablist"
              aria-label={t.importModalTitle}
              className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/[0.09]"
            >
              <button
                role="tab"
                type="button"
                aria-selected={activeTab === 'single'}
                onClick={() => setActiveTab('single')}
                className={`relative flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'single'
                    ? 'text-zinc-950'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {activeTab === 'single' && (
                  <AnimatedTabIndicator
                    layoutId="import-mode-tab"
                    className="rounded-lg bg-white shadow-sm"
                  />
                )}
                <Link2 className="relative z-10 w-3.5 h-3.5" />
                <span className="relative z-10">{t.importTabSingle}</span>
              </button>
              <button
                role="tab"
                type="button"
                aria-selected={activeTab === 'playlist'}
                onClick={() => setActiveTab('playlist')}
                className={`relative flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'playlist'
                    ? 'text-zinc-950'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {activeTab === 'playlist' && (
                  <AnimatedTabIndicator
                    layoutId="import-mode-tab"
                    className="rounded-lg bg-white shadow-sm"
                  />
                )}
                <ListMusic className="relative z-10 w-3.5 h-3.5" />
                <span className="relative z-10">{t.importTabPlaylist}</span>
              </button>
            </div>

            {activeTab === 'single' ? (
              <div className="space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleResolveSingleUrl(urlInput, true);
                  }}
                  className="space-y-3"
                >
                  <label
                    htmlFor="link-import-input"
                    className="block text-xs font-medium text-zinc-300"
                  >
                    {t.importSingleUrlLabel}
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      id="link-import-input"
                      type="url"
                      autoFocus
                      value={urlInput}
                      onChange={(e) => {
                        setUrlInput(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="https://open.spotify.com/track/... veya https://www.youtube.com/watch?v=..."
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/70"
                    />
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white transition-colors whitespace-nowrap shrink-0 shadow-lg shadow-rose-500/20"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{t.importMatching}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{t.importAndPlayBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                  {error && <p className="text-xs text-rose-400">{error}</p>}
                </form>

                {resolvedTrack && (
                  <div className="rounded-xl liquid-glass-subtle p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CoverArt src={resolvedTrack.coverUrl} alt={resolvedTrack.title} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {resolvedTrack.title}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">
                          {resolvedTrack.artist}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onImportAndPlay(resolvedTrack);
                        onClose();
                      }}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shrink-0"
                    >
                      {t.importPlayNowBtn}
                    </button>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>{t.importQuickSamples}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {SAMPLE_IMPORT_LINKS.map((sample) => (
                      <button
                        key={sample.url}
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          setUrlInput(sample.url);
                          handleResolveSingleUrl(sample.url, true);
                        }}
                        className="group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl liquid-glass-subtle hover:bg-white/[0.08] text-left transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate">
                            {sample.label}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate">
                            {sample.subtitle}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                          <span>{t.importSampleBtn}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {importedTracks.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-white/[0.08]">
                    <div className="text-xs font-medium text-zinc-400">
                      {t.importRecentlyImported(importedTracks.length)}
                    </div>
                    <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                      {importedTracks.slice(0, 5).map((tr) => (
                        <button
                          key={tr.id}
                          type="button"
                          onClick={() => {
                            onImportAndPlay(tr);
                            onClose();
                          }}
                          className="w-full flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg hover:bg-white/[0.06] text-left transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CoverArt src={tr.coverUrl} alt={tr.title} size="xs" />
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-white truncate">
                                {tr.title}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate">
                                {tr.artist}
                              </div>
                            </div>
                          </div>
                          <Play className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Multi-Track Playlist Importer Tab */
              <form onSubmit={handleImportMultiTrackPlaylist} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="spotify-playlist-url-input"
                    className="block text-xs font-medium text-zinc-300"
                  >
                    {t.importSpotifyUrlLabel}
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      id="spotify-playlist-url-input"
                      type="url"
                      value={playlistUrlInput}
                      onChange={(e) => handlePlaylistUrlChange(e.target.value)}
                      placeholder="https://open.spotify.com/playlist/..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/70"
                    />
                    <button
                      type="button"
                      disabled={isFetchingEmbed || isMatchingTracks}
                      onClick={() => handleFetchSpotifyPlaylistUrl()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-white transition-colors whitespace-nowrap shrink-0"
                    >
                      {isFetchingEmbed && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isFetchingEmbed ? t.importReadingUrl : t.importReadUrl}</span>
                    </button>
                  </div>
                </div>

                {spotifyLoadedCount !== null && spotifyLoadedCount > 0 && !playlistError && (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2 text-xs text-emerald-200 leading-relaxed">
                    {t.importSpotifyLoadedCount(spotifyLoadedCount)}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="import-playlist-name-input"
                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                  >
                    {t.importPlaylistNameLabel}
                  </label>
                  <input
                    id="import-playlist-name-input"
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder={t.importPlaylistNamePlaceholder}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/70"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="playlist-tracklist-textarea"
                      className="flex items-center gap-1.5 text-xs font-medium text-zinc-300"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t.importTracklistLabel}</span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      <input
                        ref={csvFileInputRef}
                        type="file"
                        accept=".csv,.txt,text/csv,text/plain"
                        onChange={handleCsvFileUpload}
                        className="hidden"
                        aria-label={t.importUploadCsvBtn}
                      />
                      <button
                        type="button"
                        onClick={() => csvFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-[11px] font-medium text-zinc-200 transition-colors"
                      >
                        <Upload className="w-3 h-3 text-rose-400" />
                        <span>{t.importUploadCsvBtn}</span>
                      </button>
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {t.tracksDetected(parsedLineCount)}
                      </span>
                    </div>
                  </div>
                  <textarea
                    id="playlist-tracklist-textarea"
                    rows={5}
                    value={tracklistText}
                    onChange={(e) => {
                      setTracklistText(e.target.value);
                      if (playlistError) setPlaylistError(null);
                      if (spotifyLoadedCount !== null) setSpotifyLoadedCount(null);
                    }}
                    placeholder={`Sanatçı - Şarkı Adı\nÖrn: Daft Punk - Instant Crush\nveya Exportify CSV yapıştırın / yükleyin`}
                    className="w-full rounded-xl bg-white/[0.05] border border-white/[0.1] p-3 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/70 font-mono leading-relaxed resize-none"
                  />
                </div>

                {playlistError && (
                  <div
                    role="alert"
                    className="rounded-xl bg-rose-500/12 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-200 leading-relaxed"
                  >
                    {playlistError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isMatchingTracks || isFetchingEmbed}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white transition-colors whitespace-nowrap shrink-0 shadow-lg shadow-rose-500/20"
                  >
                    {isMatchingTracks ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          {matchProgress
                            ? t.importMatchingProgress(matchProgress.done, matchProgress.total)
                            : t.importMatching}
                        </span>
                      </>
                    ) : (
                      <>
                        <ListMusic className="w-4 h-4" />
                        <span>{t.importPlaylistButton}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
