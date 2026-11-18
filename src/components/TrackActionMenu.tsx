import { useEffect, useRef, useState } from 'react';
import { ListPlus, Check, Plus, FileText } from 'lucide-react';
import type { Playlist, Track } from '../types/music';
import { useI18n } from '../utils/I18nContext';

interface TrackActionMenuProps {
  track: Track;
  playlists: Playlist[];
  onAddToPlaylist: (playlistId: string, track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onOpenLyrics: (track: Track) => void;
  onRequestNewPlaylist: (seedTrack: Track) => void;
}

export function TrackActionMenu({
  track,
  playlists,
  onAddToPlaylist,
  onAddToQueue,
  onOpenLyrics,
  onRequestNewPlaylist,
}: TrackActionMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label={t.moreOptionsAria(track.title)}
        aria-expanded={open}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-2 focus-visible:outline-rose-500"
      >
        <ListPlus className="w-4 h-4" />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          role="menu"
          className="absolute right-0 top-9 z-40 w-56 rounded-xl bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.1] shadow-2xl p-1.5 text-sm text-zinc-200"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onAddToQueue(track);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-white/[0.08] transition-colors"
          >
            <ListPlus className="w-4 h-4 text-zinc-400" />
            <span>{t.menuAddToUpNext}</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onOpenLyrics(track);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-white/[0.08] transition-colors"
          >
            <FileText className="w-4 h-4 text-zinc-400" />
            <span>{t.menuViewLyrics}</span>
          </button>

          <div className="my-1 border-t border-white/[0.08]" />
          <div className="px-3 py-1 text-xs font-medium text-zinc-400">{t.menuAddToPlaylist}</div>

          <div className="max-h-36 overflow-y-auto space-y-0.5">
            {playlists.map((pl) => {
              const alreadyIn = pl.trackIds.includes(track.id);
              return (
                <button
                  key={pl.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onAddToPlaylist(pl.id, track);
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-left hover:bg-white/[0.08] transition-colors"
                >
                  <span className="truncate">{pl.name}</span>
                  {alreadyIn && <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onRequestNewPlaylist(track);
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-left text-rose-400 hover:bg-white/[0.08] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.menuNewPlaylist}</span>
          </button>
        </div>
      )}
    </div>
  );
}
