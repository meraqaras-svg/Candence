import type { Track } from '../types/music';
import { upscaleItunesArtwork } from './formatters';

interface ItunesSearchResultItem {
  wrapperType?: string;
  kind?: string;
  trackId?: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
  primaryGenreName?: string;
}

interface ItunesSearchResponse {
  resultCount: number;
  results: ItunesSearchResultItem[];
}

/**
 * Queries iTunes Search API strictly for high-resolution album covers and track metadata
 * (title, artist, album, and full song duration). Never returns or plays 30-second audio previews.
 */
export async function searchItunesTracks(
  query: string,
  signal?: AbortSignal
): Promise<Track[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    trimmed
  )}&media=music&entity=song&limit=18`;

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Metadata lookup returned ${response.status}`);
  }

  const data = (await response.json()) as ItunesSearchResponse;
  if (!Array.isArray(data.results)) return [];

  const now = Date.now();
  return data.results
    .filter((item) => item.trackId && item.trackName)
    .map((item) => {
      const fullDurationSec = item.trackTimeMillis
        ? Math.max(90, Math.round(item.trackTimeMillis / 1000))
        : 215;

      return {
        id: `meta-${item.trackId}`,
        title: item.trackName || 'Unknown Track',
        artist: item.artistName || 'Unknown Artist',
        album: item.collectionName || 'Single',
        duration: fullDurationSec,
        coverUrl: upscaleItunesArtwork(item.artworkUrl100, 600),
        // Never set audioUrl to 30-second iTunes previewUrl
        source: 'youtube' as const,
        addedAt: now,
        previewNote: 'Lossless Match',
      };
    });
}

interface LrcLibResponse {
  syncedLyrics?: string;
  plainLyrics?: string;
  instrumental?: boolean;
}

/**
 * Queries the free public LRCLIB API (https://lrclib.net/api/get with fallback to /api/search)
 * to retrieve time-synced LRC lyrics (`[mm:ss.xx]`) or plain lyrics.
 */
export async function fetchFreeLyrics(
  artist: string,
  title: string,
  signal?: AbortSignal
): Promise<string | null> {
  const cleanTitle = title
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .trim();
  const cleanArtist = artist.replace(/\s*-\s*Topic$/i, '').trim();

  if (!cleanTitle) return null;

  try {
    const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
      cleanArtist
    )}&track_name=${encodeURIComponent(cleanTitle)}`;
    const response = await fetch(getUrl, { signal });
    if (response.ok) {
      const data = (await response.json()) as LrcLibResponse;
      if (data.syncedLyrics) return data.syncedLyrics;
      if (data.plainLyrics) return data.plainLyrics;
      if (data.instrumental) return '[00:00.00] ♪ Instrumental ♪';
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') return null;
  }

  // Fallback to LRCLIB search endpoint if exact match returned 404
  try {
    const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(
      cleanTitle
    )}&artist_name=${encodeURIComponent(cleanArtist)}`;
    const searchRes = await fetch(searchUrl, { signal });
    if (!searchRes.ok) return null;

    const items = (await searchRes.json()) as LrcLibResponse[];
    if (!Array.isArray(items) || items.length === 0) return null;

    const syncedHit = items.find((i) => Boolean(i.syncedLyrics));
    if (syncedHit?.syncedLyrics) return syncedHit.syncedLyrics;

    const plainHit = items.find((i) => Boolean(i.plainLyrics));
    if (plainHit?.plainLyrics) return plainHit.plainLyrics;

    return null;
  } catch {
    return null;
  }
}
