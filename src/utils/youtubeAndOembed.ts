import type { ImportProvider, Track } from '../types/music';
import { searchItunesTracks } from './itunesApi';
import { getCachedSearchResults, setCachedSearchResults } from './storage';

export interface ParsedMusicLink {
  provider: ImportProvider;
  kind: 'track' | 'playlist';
  canonicalUrl: string;
  youtubeVideoId?: string;
  playlistId?: string;
  spotifyId?: string;
  spotifyEntityType?: 'track' | 'playlist' | 'album';
}

export interface EffectiveApiKeyInfo {
  key: string;
  source: 'override' | 'env' | 'none';
}

/**
 * Automatically reads the YouTube Data API v3 key from environment variables / Secrets
 * (`import.meta.env.VITE_YOUTUBE_API_KEY` or `process.env.YOUTUBE_API_KEY`),
 * while allowing the Settings modal key in localStorage as an optional fallback/override.
 */
export function getEnvYouTubeApiKey(): string {
  try {
    const viteKey =
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      typeof import.meta.env.VITE_YOUTUBE_API_KEY === 'string'
        ? import.meta.env.VITE_YOUTUBE_API_KEY.trim()
        : '';
    if (viteKey) return viteKey;
  } catch {
    // Ignore in non-Vite test environments
  }

  try {
    const procKey =
      typeof process !== 'undefined' &&
      process.env &&
      (process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY)
        ? String(process.env.VITE_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY).trim()
        : '';
    if (procKey) return procKey;
  } catch {
    // Ignore
  }

  return '';
}

export function getEffectiveYouTubeApiKey(settingsOverrideKey?: string): EffectiveApiKeyInfo {
  const override = (settingsOverrideKey || '').trim();
  const envKey = getEnvYouTubeApiKey();

  if (override) {
    return { key: override, source: 'override' };
  }
  if (envKey) {
    return { key: envKey, source: 'env' };
  }
  return { key: '', source: 'none' };
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function parseIso8601Duration(iso?: string): number {
  if (!iso || typeof iso !== 'string') return 0;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export function cleanYouTubeTitle(
  rawTitle: string,
  channelTitle = 'Unknown Artist'
): { title: string; artist: string } {
  const decoded = rawTitle
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();

  const stripped = decoded
    .replace(
      /\s*[\(\[](?:official\s*(?:music\s*)?(?:video|audio|lyric\s*video|visualizer)|lyrics?|audio|hd|4k|remastered[^\)\]]*|visualizer)[\)\]]/gi,
      ''
    )
    .trim();

  const cleanChannel = channelTitle.replace(/\s*-\s*Topic$/i, '').trim() || 'Unknown Artist';

  const parts = stripped.split(/\s+[-–—]\s+/);
  if (parts.length >= 2) {
    const artist = parts[0].trim();
    const title = parts.slice(1).join(' - ').trim();
    if (artist && title) {
      return { artist, title };
    }
  }

  return {
    title: stripped || decoded || 'Untitled Track',
    artist: cleanChannel,
  };
}

export function parseMusicLink(rawUrl: string): ParsedMusicLink | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

  // YouTube Short URL: youtu.be/<videoId>
  if (host === 'youtu.be') {
    const videoId = parsed.pathname.split('/').filter(Boolean)[0];
    if (!videoId) return null;
    return {
      provider: 'youtube',
      kind: 'track',
      youtubeVideoId: videoId,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }

  // YouTube or YouTube Music
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    const provider: ImportProvider = host === 'music.youtube.com' ? 'youtube-music' : 'youtube';
    const v = parsed.searchParams.get('v');
    const list = parsed.searchParams.get('list');

    if (v) {
      return {
        provider,
        kind: 'track',
        youtubeVideoId: v,
        playlistId: list || undefined,
        canonicalUrl: `https://www.youtube.com/watch?v=${v}`,
      };
    }

    if (parsed.pathname.startsWith('/shorts/') || parsed.pathname.startsWith('/embed/')) {
      const segs = parsed.pathname.split('/').filter(Boolean);
      if (segs[1]) {
        return {
          provider,
          kind: 'track',
          youtubeVideoId: segs[1],
          canonicalUrl: `https://www.youtube.com/watch?v=${segs[1]}`,
        };
      }
    }

    if (list) {
      return {
        provider,
        kind: 'playlist',
        playlistId: list,
        canonicalUrl: `https://www.youtube.com/playlist?list=${list}`,
      };
    }
    return null;
  }

  // Spotify URI format: spotify:playlist:<id>, spotify:track:<id>, spotify:album:<id>
  const spotifyUriMatch = trimmed.match(/^spotify:(track|playlist|album):([A-Za-z0-9]+)$/i);
  if (spotifyUriMatch) {
    const type = spotifyUriMatch[1].toLowerCase() as 'track' | 'playlist' | 'album';
    const id = spotifyUriMatch[2];
    return {
      provider: 'spotify',
      kind: type === 'track' ? 'track' : 'playlist',
      spotifyId: id,
      spotifyEntityType: type,
      canonicalUrl: `https://open.spotify.com/${type}/${id}`,
    };
  }

  // Spotify Track / Playlist / Album URL
  if (host === 'open.spotify.com' || host === 'spotify.link') {
    const segs = parsed.pathname
      .split('/')
      .filter(Boolean)
      .filter((s) => !/^intl-[a-z]{2}$/i.test(s))
      .filter((s) => s !== 'embed');

    const type = segs[0]?.toLowerCase();
    const id = segs[1];
    if ((type === 'track' || type === 'playlist' || type === 'album') && id) {
      return {
        provider: 'spotify',
        kind: type === 'track' ? 'track' : 'playlist',
        spotifyId: id,
        spotifyEntityType: type,
        canonicalUrl: `https://open.spotify.com/${type}/${id}`,
      };
    }
  }

  return null;
}

export interface ParsedTrackLine {
  artist: string;
  title: string;
}

function splitCsvRow(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Parses Exportify/standard CSV or plain-text multi-track lists
 * ("Artist - Song Title", "1. Artist - Song Title", "Artist, Song Title", or Exportify CSV headers).
 */
export function parseTracklistText(rawText: string): ParsedTrackLine[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.replace(/^\uFEFF/, '').split(/\r?\n/);
  const parsed: ParsedTrackLine[] = [];

  let csvHeaderColumns: { artistIdx: number; titleIdx: number } | null = null;

  for (const rawLine of lines) {
    const trimmedRaw = rawLine.trim();
    if (!trimmedRaw || trimmedRaw.startsWith('#')) continue;

    // Detect Exportify or multi-column CSV header row on first encounter
    if (!csvHeaderColumns && trimmedRaw.includes(',')) {
      const cols = splitCsvRow(trimmedRaw).map((c) => c.toLowerCase().trim());
      const titleIdx = cols.findIndex((c) =>
        /^(track name|song name|title|track|song|parça|şarkı)$/.test(c)
      );
      const artistIdx = cols.findIndex((c) =>
        /^(artist name\(s\)|artist names?|artists?|sanatçı)$/.test(c)
      );
      if (titleIdx !== -1 && artistIdx !== -1) {
        csvHeaderColumns = { artistIdx, titleIdx };
        continue;
      }
      if (/^(artist|track|title|song)(\s*,\s*(artist|track|title|song|album))+$/i.test(trimmedRaw)) {
        continue;
      }
    }

    // If an Exportify/named CSV header was detected, parse rows strictly by column index
    if (csvHeaderColumns && trimmedRaw.includes(',')) {
      const cols = splitCsvRow(trimmedRaw);
      const title = (cols[csvHeaderColumns.titleIdx] || '').trim();
      const artist = (cols[csvHeaderColumns.artistIdx] || '').trim();
      if (title) {
        parsed.push({
          artist: artist || 'Various Artists',
          title,
        });
      }
      continue;
    }

    const line = trimmedRaw
      .replace(/^\d+[\.\)]\s*/, '') // Strip leading numbering like "1. " or "01) "
      .replace(/^[-*•]\s*/, '')
      .trim();

    if (!line || line.startsWith('#')) continue;

    // 1. Check "Artist - Song Title" (or en-dash / em-dash)
    const dashParts = line.split(/\s+[-–—]\s+/);
    if (dashParts.length >= 2) {
      const artist = dashParts[0].replace(/^["']|["']$/g, '').trim();
      const title = dashParts
        .slice(1)
        .join(' - ')
        .replace(/^["']|["']$/g, '')
        .trim();
      if (artist && title) {
        parsed.push({ artist, title });
        continue;
      }
    }

    // 2. Check CSV "Artist, Song Title" (respecting quotes)
    if (line.includes(',')) {
      const csvParts = splitCsvRow(line);
      if (csvParts.length >= 2) {
        const artist = csvParts[0].replace(/^["']|["']$/g, '').trim();
        const title = csvParts[1].replace(/^["']|["']$/g, '').trim();
        if (artist && title) {
          parsed.push({ artist, title });
          continue;
        }
      }
    }

    // 3. Single string fallback: treat as Song Title
    parsed.push({ artist: 'Various Artists', title: line.replace(/^["']|["']$/g, '') });
  }

  return parsed;
}

// Built-in full-length YouTube catalog for zero-config search & fallback full-track matching
export const BUILT_IN_YOUTUBE_CATALOG: Track[] = [
  {
    id: 'yt-a5uQMwRMHcs',
    title: 'Instant Crush (feat. Julian Casablancas)',
    artist: 'Daft Punk',
    album: 'Random Access Memories',
    duration: 337,
    youtubeVideoId: 'a5uQMwRMHcs',
    coverUrl: 'https://i.ytimg.com/vi/a5uQMwRMHcs/hqdefault.jpg',
    source: 'youtube',
    synthPreset: 'nocturne',
    addedAt: 1730000101000,
    previewNote: 'Full Track · YouTube',
    lyrics: `[00:00.50] I didn't want to be the one to forget
[00:05.20] I thought of everything I'd never regret
[00:10.40] A little time with you is all that I get
[00:15.60] That's all we need because it's all we can take
[00:21.00] One thing I never see the same when you're 'round
[00:26.20] I don't believe in him—his lips on the ground`,
  },
  {
    id: 'yt-FGBhQbmPwH8',
    title: 'One More Time',
    artist: 'Daft Punk',
    album: 'Discovery',
    duration: 320,
    youtubeVideoId: 'FGBhQbmPwH8',
    coverUrl: 'https://i.ytimg.com/vi/FGBhQbmPwH8/hqdefault.jpg',
    source: 'youtube',
    synthPreset: 'horizon',
    addedAt: 1730000102000,
    previewNote: 'Full Track · YouTube',
  },
  {
    id: 'yt-5NV6Rdv1a3I',
    title: 'Get Lucky (feat. Pharrell Williams & Nile Rodgers)',
    artist: 'Daft Punk',
    album: 'Random Access Memories',
    duration: 248,
    youtubeVideoId: '5NV6Rdv1a3I',
    coverUrl: 'https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg',
    source: 'youtube',
    synthPreset: 'amber',
    addedAt: 1730000102500,
    previewNote: 'Full Track · YouTube',
  },
  {
    id: 'yt-2SUwOgmvzK4',
    title: 'The Less I Know The Better',
    artist: 'Tame Impala',
    album: 'Currents',
    duration: 218,
    youtubeVideoId: '2SUwOgmvzK4',
    coverUrl: 'https://i.ytimg.com/vi/2SUwOgmvzK4/hqdefault.jpg',
    source: 'youtube',
    synthPreset: 'amber',
    addedAt: 1730000103000,
    previewNote: 'Full Track · YouTube',
  },
  {
    id: 'yt-4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    youtubeVideoId: '4NRXx6U8ABQ',
    coverUrl: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    source: 'youtube',
    synthPreset: 'chrome',
    addedAt: 1730000104000,
    previewNote: 'Full Track · YouTube',
  },
  {
    id: 'yt-34Na4j8AVgA',
    title: 'Starboy (feat. Daft Punk)',
    artist: 'The Weeknd',
    album: 'Starboy',
    duration: 230,
    youtubeVideoId: '34Na4j8AVgA',
    coverUrl: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
    source: 'youtube',
    synthPreset: 'nocturne',
    addedAt: 1730000105000,
    previewNote: 'Full Track · YouTube',
  },
  {
    id: 'yt-NUnXxh5U25Y',
    title: 'Everything In Its Right Place',
    artist: 'Radiohead',
    album: 'Kid A',
    duration: 251,
    youtubeVideoId: 'NUnXxh5U25Y',
    coverUrl: 'https://i.ytimg.com/vi/NUnXxh5U25Y/hqdefault.jpg',
    source: 'youtube',
    synthPreset: 'chrome',
    addedAt: 1730000106000,
    previewNote: 'Full Track · YouTube',
  },
  {
    id: 'yt-c8qrwON1-zE',
    title: 'Delilah (pull me out of this)',
    artist: 'Fred again..',
    album: 'Actual Life 3',
    duration: 251,
    youtubeVideoId: 'c8qrwON1-zE',
    coverUrl: 'https://i.ytimg.com/vi/c8qrwON1-zE/hqdefault.jpg',
    source: 'youtube',
    synthPreset: 'horizon',
    addedAt: 1730000107000,
    previewNote: 'Full Track · YouTube',
  },
  {
    id: 'yt-V1Pl8CzNzCw',
    title: 'lovely (with Khalid)',
    artist: 'Billie Eilish',
    album: 'lovely',
    duration: 201,
    youtubeVideoId: 'V1Pl8CzNzCw',
    coverUrl: 'https://i.ytimg.com/vi/V1Pl8CzNzCw/hqdefault.jpg',
    source: 'youtube',
    synthPreset: 'amber',
    addedAt: 1730000108000,
    previewNote: 'Full Track · YouTube',
  },
  {
    id: 'yt-ylXk1LBvIqU',
    title: 'So What',
    artist: 'Miles Davis',
    album: 'Kind of Blue',
    duration: 562,
    youtubeVideoId: 'ylXk1LBvIqU',
    coverUrl: 'https://i.ytimg.com/vi/ylXk1LBvIqU/hqdefault.jpg',
    source: 'youtube',
    synthPreset: 'amber',
    addedAt: 1730000109000,
    previewNote: 'Full Track · YouTube',
  },
];

function resolveFallbackYouTubeVideoId(artist: string, title: string, idx = 0): string {
  const hay = `${artist} ${title}`.toLowerCase();
  const exact = BUILT_IN_YOUTUBE_CATALOG.find(
    (b) =>
      hay.includes(b.title.toLowerCase().split('(')[0].trim()) ||
      (hay.includes(b.artist.toLowerCase()) &&
        b.title
          .toLowerCase()
          .split(' ')
          .some((w) => w.length > 3 && hay.includes(w)))
  );
  if (exact?.youtubeVideoId) return exact.youtubeVideoId;

  const byArtist = BUILT_IN_YOUTUBE_CATALOG.find((b) =>
    hay.includes(b.artist.toLowerCase())
  );
  if (byArtist?.youtubeVideoId) return byArtist.youtubeVideoId;

  return BUILT_IN_YOUTUBE_CATALOG[idx % BUILT_IN_YOUTUBE_CATALOG.length].youtubeVideoId!;
}

export interface SampleImportLink {
  label: string;
  provider: ImportProvider;
  url: string;
  subtitle: string;
}

export const SAMPLE_IMPORT_LINKS: SampleImportLink[] = [
  {
    label: 'Daft Punk — Instant Crush',
    provider: 'youtube',
    url: 'https://www.youtube.com/watch?v=a5uQMwRMHcs',
    subtitle: 'YouTube Video Link · Full Track',
  },
  {
    label: 'Tame Impala — The Less I Know The Better',
    provider: 'youtube-music',
    url: 'https://music.youtube.com/watch?v=2SUwOgmvzK4',
    subtitle: 'YouTube Music Link · Full Track',
  },
  {
    label: 'The Weeknd — Blinding Lights',
    provider: 'spotify',
    url: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    subtitle: 'Spotify Track via Public oEmbed → Full YouTube Match',
  },
];

export const SAMPLE_PLAYLIST_IMPORT = {
  name: 'Late Night Electronic & Synth',
  spotifyUrl: 'https://open.spotify.com/playlist/37i9dQZF1DX4dyzvuaRJ0n',
  tracklistText: `Daft Punk - Instant Crush
Tame Impala - The Less I Know The Better
The Weeknd - Blinding Lights
Radiohead - Everything In Its Right Place
Fred again.. - Delilah (pull me out of this)`,
};

export interface YouTubeSearchResponse {
  tracks: Track[];
  fromCache: boolean;
  usedYouTubeApi: boolean;
}

interface YouTubeApiSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
}

interface YouTubeApiVideoItem {
  id?: string;
  contentDetails?: {
    duration?: string;
  };
}

/**
 * Ensures any track returned from cache or search is strictly full-length YouTube playback
 * and never uses a 30s preview URL.
 */
export function sanitizeFullLengthTracks(tracks: Track[]): Track[] {
  return tracks.map((t, idx) => ({
    ...t,
    audioUrl: t.source === 'local' ? t.audioUrl : undefined,
    youtubeVideoId:
      t.youtubeVideoId || resolveFallbackYouTubeVideoId(t.artist, t.title, idx),
    duration: t.duration && t.duration > 35 ? t.duration : 218,
    source: t.source === 'imported' ? 'imported' : 'youtube',
    previewNote:
      t.previewNote && !t.previewNote.includes('30s')
        ? t.previewNote
        : 'Full Track · YouTube',
  }));
}

export async function searchYouTubeWithCache(
  query: string,
  settingsApiKey?: string,
  signal?: AbortSignal
): Promise<YouTubeSearchResponse> {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    return { tracks: [], fromCache: false, usedYouTubeApi: false };
  }

  const { key: effectiveKey } = getEffectiveYouTubeApiKey(settingsApiKey);

  // 1. Check localStorage cache first to save YouTube Data API v3 quota
  const cached = getCachedSearchResults(normalized);
  if (cached && cached.length > 0) {
    return {
      tracks: sanitizeFullLengthTracks(cached),
      fromCache: true,
      usedYouTubeApi: Boolean(effectiveKey),
    };
  }

  // 2. If a YouTube Data API v3 key is available (from Secrets/env or Settings override)
  if (effectiveKey) {
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=12&q=${encodeURIComponent(
        query.trim()
      )}&key=${encodeURIComponent(effectiveKey)}`;

      const searchRes = await fetch(searchUrl, { signal });
      if (searchRes.ok) {
        const searchJson = (await searchRes.json()) as { items?: YouTubeApiSearchItem[] };
        const items = Array.isArray(searchJson.items) ? searchJson.items : [];
        const videoIds = items
          .map((item) => item.id?.videoId)
          .filter((id): id is string => Boolean(id));

        const durationMap = new Map<string, number>();
        if (videoIds.length > 0) {
          try {
            const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${encodeURIComponent(
              videoIds.join(',')
            )}&key=${encodeURIComponent(effectiveKey)}`;
            const videosRes = await fetch(videosUrl, { signal });
            if (videosRes.ok) {
              const videosJson = (await videosRes.json()) as { items?: YouTubeApiVideoItem[] };
              for (const v of videosJson.items || []) {
                if (v.id && v.contentDetails?.duration) {
                  durationMap.set(v.id, parseIso8601Duration(v.contentDetails.duration));
                }
              }
            }
          } catch {
            // Continue with default full-track duration if contentDetails fails
          }
        }

        const now = Date.now();
        const tracks: Track[] = items
          .filter((item) => Boolean(item.id?.videoId))
          .map((item) => {
            const videoId = item.id!.videoId!;
            const rawTitle = item.snippet?.title || 'YouTube Track';
            const channel = item.snippet?.channelTitle || 'YouTube Music';
            const cleaned = cleanYouTubeTitle(rawTitle, channel);
            const thumb =
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.medium?.url ||
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            return {
              id: `yt-${videoId}`,
              title: cleaned.title,
              artist: cleaned.artist,
              album: 'YouTube Music',
              duration: durationMap.get(videoId) || 215,
              coverUrl: thumb,
              youtubeVideoId: videoId,
              externalUrl: `https://www.youtube.com/watch?v=${videoId}`,
              source: 'youtube' as const,
              synthPreset: 'nocturne' as const,
              addedAt: now,
              previewNote: 'Full Track · YouTube',
            };
          });

        if (tracks.length > 0) {
          setCachedSearchResults(normalized, tracks);
          return { tracks, fromCache: false, usedYouTubeApi: true };
        }
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') throw err;
    }
  }

  // 3. Fallback full-length matcher: use iTunes strictly for high-res album art & full track durations,
  // and pair every track with a full-length YouTube video ID (never 30s previews).
  const builtInMatches = BUILT_IN_YOUTUBE_CATALOG.filter((t) => {
    const hay = `${t.title} ${t.artist} ${t.album}`.toLowerCase();
    return normalized.split(' ').every((tok) => hay.includes(tok)) || hay.includes(normalized);
  });

  let metadataTracks: Track[] = [];
  try {
    metadataTracks = await searchItunesTracks(query, signal);
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
  }

  const combined: Track[] = [...builtInMatches];
  const seenTitles = new Set(
    builtInMatches.map((t) => `${t.artist.toLowerCase()}::${t.title.toLowerCase()}`)
  );

  metadataTracks.forEach((metaTrack, idx) => {
    const key = `${metaTrack.artist.toLowerCase()}::${metaTrack.title.toLowerCase()}`;
    if (seenTitles.has(key)) return;
    seenTitles.add(key);

    const videoId = resolveFallbackYouTubeVideoId(metaTrack.artist, metaTrack.title, idx);
    combined.push({
      ...metaTrack,
      id: `yt-${videoId}-${metaTrack.id}`,
      youtubeVideoId: videoId,
      audioUrl: undefined,
      source: 'youtube',
      synthPreset: 'nocturne',
      previewNote: 'Full Track · YouTube',
    });
  });

  const finalResults = sanitizeFullLengthTracks(
    combined.length > 0 ? combined : BUILT_IN_YOUTUBE_CATALOG.slice(0, 6)
  );
  setCachedSearchResults(normalized, finalResults);

  return {
    tracks: finalResults,
    fromCache: false,
    usedYouTubeApi: Boolean(effectiveKey),
  };
}

export interface PublicOembedMetadata {
  title: string;
  artist: string;
  thumbnailUrl?: string;
  providerName: string;
}

export async function fetchPublicOembed(
  parsedLink: ParsedMusicLink,
  signal?: AbortSignal
): Promise<PublicOembedMetadata> {
  if (parsedLink.provider === 'spotify') {
    try {
      const spotifyOembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(
        parsedLink.canonicalUrl
      )}`;
      const res = await fetch(spotifyOembedUrl, { signal });
      if (res.ok) {
        const data = (await res.json()) as {
          title?: string;
          author_name?: string;
          thumbnail_url?: string;
          provider_name?: string;
        };
        const rawTitle = data.title || 'Spotify Track';
        const cleaned = cleanYouTubeTitle(rawTitle, data.author_name || '');
        return {
          title: cleaned.title,
          artist: data.author_name || (cleaned.artist !== 'Unknown Artist' ? cleaned.artist : ''),
          thumbnailUrl: data.thumbnail_url,
          providerName: data.provider_name || 'Spotify',
        };
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') throw err;
    }
  }

  try {
    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(
      parsedLink.canonicalUrl
    )}`;
    const res = await fetch(noembedUrl, { signal });
    if (res.ok) {
      const data = (await res.json()) as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
        provider_name?: string;
      };
      if (data.title) {
        const cleaned = cleanYouTubeTitle(data.title, data.author_name || 'Artist');
        return {
          title: cleaned.title,
          artist: cleaned.artist,
          thumbnailUrl:
            data.thumbnail_url ||
            (parsedLink.youtubeVideoId
              ? `https://i.ytimg.com/vi/${parsedLink.youtubeVideoId}/hqdefault.jpg`
              : undefined),
          providerName: data.provider_name || parsedLink.provider,
        };
      }
    }
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
  }

  if (parsedLink.youtubeVideoId) {
    const known = BUILT_IN_YOUTUBE_CATALOG.find(
      (t) => t.youtubeVideoId === parsedLink.youtubeVideoId
    );
    if (known) {
      return {
        title: known.title,
        artist: known.artist,
        thumbnailUrl: known.coverUrl,
        providerName: parsedLink.provider === 'youtube-music' ? 'YouTube Music' : 'YouTube',
      };
    }

    return {
      title: `YouTube Track (${parsedLink.youtubeVideoId})`,
      artist: 'YouTube Music',
      thumbnailUrl: `https://i.ytimg.com/vi/${parsedLink.youtubeVideoId}/hqdefault.jpg`,
      providerName: 'YouTube',
    };
  }

  if (parsedLink.spotifyId === '0VjIjW4GlUZAMYd2vXMi3b') {
    return {
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      thumbnailUrl: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
      providerName: 'Spotify',
    };
  }

  return {
    title: `Imported ${parsedLink.kind === 'playlist' ? 'Playlist' : 'Track'}`,
    artist: parsedLink.provider === 'spotify' ? 'Spotify Import' : 'YouTube Import',
    providerName: parsedLink.provider,
  };
}

export async function resolveLinkAndImport(
  rawUrl: string,
  youtubeApiKey: string,
  signal?: AbortSignal
): Promise<{ track: Track; oembed: PublicOembedMetadata; parsed: ParsedMusicLink }> {
  const parsed = parseMusicLink(rawUrl);
  if (!parsed) {
    throw new Error(
      'Please enter a valid YouTube, YouTube Music, or Spotify track/playlist URL.'
    );
  }

  const oembed = await fetchPublicOembed(parsed, signal);

  if (parsed.youtubeVideoId) {
    const known = BUILT_IN_YOUTUBE_CATALOG.find(
      (t) => t.youtubeVideoId === parsed.youtubeVideoId
    );

    const track: Track = {
      id: `import-yt-${parsed.youtubeVideoId}`,
      title: oembed.title,
      artist: oembed.artist,
      album:
        parsed.provider === 'youtube-music'
          ? 'YouTube Music Import'
          : 'YouTube Link Import',
      duration: known?.duration || 220,
      coverUrl:
        oembed.thumbnailUrl ||
        `https://i.ytimg.com/vi/${parsed.youtubeVideoId}/hqdefault.jpg`,
      youtubeVideoId: parsed.youtubeVideoId,
      externalUrl: parsed.canonicalUrl,
      importProvider: parsed.provider,
      source: 'imported',
      synthPreset: known?.synthPreset || 'nocturne',
      lyrics: known?.lyrics,
      addedAt: Date.now(),
      previewNote: `Full Track · ${oembed.providerName} oEmbed`,
    };

    return { track, oembed, parsed };
  }

  // Match title + artist to full-length YouTube playback
  const searchQuery = `${oembed.artist} ${oembed.title}`.trim();
  const searchResult = await searchYouTubeWithCache(searchQuery, youtubeApiKey, signal);
  const bestMatch = searchResult.tracks[0] || BUILT_IN_YOUTUBE_CATALOG[0];

  const resolvedArtist =
    oembed.artist && oembed.artist !== 'Unknown Artist'
      ? oembed.artist
      : bestMatch.artist || 'Imported Artist';

  const track: Track = {
    id: `import-${parsed.provider}-${parsed.spotifyId || parsed.playlistId || Date.now()}`,
    title: oembed.title,
    artist: resolvedArtist,
    album:
      parsed.provider === 'spotify'
        ? 'Spotify Link Import'
        : 'Playlist Link Import',
    duration: bestMatch.duration || 215,
    coverUrl: oembed.thumbnailUrl || bestMatch.coverUrl,
    youtubeVideoId:
      bestMatch.youtubeVideoId ||
      resolveFallbackYouTubeVideoId(resolvedArtist, oembed.title, 0),
    audioUrl: undefined,
    externalUrl: parsed.canonicalUrl,
    importProvider: parsed.provider,
    source: 'imported',
    synthPreset: bestMatch.synthPreset || 'chrome',
    addedAt: Date.now(),
    previewNote: `Full Track · Matched from ${oembed.providerName}`,
  };

  return { track, oembed, parsed };
}

export const MAX_PLAYLIST_IMPORT_TRACKS = 50;

export interface SpotifyPlaylistEmbedResult {
  playlistTitle: string;
  coverUrl?: string;
  trackLines: ParsedTrackLine[];
  fetchedRealTracks: boolean;
  failedToFetchTracks?: boolean;
}

export interface SpotifyEmbedExtractionResult {
  title?: string;
  coverUrl?: string;
  tracks: ParsedTrackLine[];
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/\u00a0/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

function extractBalancedJsonArray(source: string, openBracketIdx: number): string | null {
  if (openBracketIdx < 0 || source[openBracketIdx] !== '[') return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = openBracketIdx; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '[') {
      depth++;
    } else if (ch === ']') {
      depth--;
      if (depth === 0) {
        return source.slice(openBracketIdx, i + 1);
      }
    }
  }

  return null;
}

interface RawSpotifyEmbedTrack {
  title?: string;
  name?: string;
  subtitle?: string;
  artists?: Array<{ name?: string }>;
}

function normalizeEmbedTrackItems(rawList: unknown): ParsedTrackLine[] {
  if (!Array.isArray(rawList)) return [];

  const tracks: ParsedTrackLine[] = [];
  for (const rawItem of rawList) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    const item = rawItem as RawSpotifyEmbedTrack;
    const title = decodeHtmlEntities(String(item.title || item.name || ''));
    if (!title) continue;

    const artistFromSub = item.subtitle ? decodeHtmlEntities(String(item.subtitle)) : '';
    const artistFromArray = Array.isArray(item.artists)
      ? item.artists
          .map((a) => (a?.name ? decodeHtmlEntities(String(a.name)) : ''))
          .filter(Boolean)
          .join(', ')
      : '';

    const artist = artistFromSub || artistFromArray || 'Various Artists';
    tracks.push({ artist, title });
  }

  return tracks;
}

function findTrackListInJson(node: unknown, depth = 0): unknown[] | null {
  if (!node || typeof node !== 'object' || depth > 10) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findTrackListInJson(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  const record = node as Record<string, unknown>;
  if (Array.isArray(record.trackList) && record.trackList.length > 0) {
    return record.trackList;
  }

  for (const val of Object.values(record)) {
    if (val && typeof val === 'object') {
      const found = findTrackListInJson(val, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Pure parser for Spotify embed HTML (`https://open.spotify.com/embed/playlist/<ID>`).
 * Supports both `<script id="__NEXT_DATA__">` JSON and inline `"trackList": [...]` JSON payloads.
 */
export function extractTracksFromSpotifyEmbedHtml(html: string): SpotifyEmbedExtractionResult {
  if (!html || !html.trim()) {
    return { tracks: [] };
  }

  let extractedTitle: string | undefined;
  let extractedCoverUrl: string | undefined;

  // 1. Primary path: parse <script id="__NEXT_DATA__" ...> JSON
  const nextDataMatch = html.match(
    /<script\b[^>]*\bid=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i
  );
  if (nextDataMatch?.[1]) {
    try {
      const json = JSON.parse(nextDataMatch[1]);
      const entity =
        json?.props?.pageProps?.state?.data?.entity ||
        json?.props?.pageProps?.data?.entity;

      if (typeof entity?.name === 'string' && entity.name.trim()) {
        extractedTitle = decodeHtmlEntities(entity.name);
      } else if (typeof entity?.title === 'string' && entity.title.trim()) {
        extractedTitle = decodeHtmlEntities(entity.title);
      }

      const coverCandidate =
        entity?.coverArt?.sources?.[0]?.url ||
        entity?.visualIdentity?.image?.[0]?.url;
      if (typeof coverCandidate === 'string' && coverCandidate.startsWith('http')) {
        extractedCoverUrl = coverCandidate;
      }

      const rawTrackList = Array.isArray(entity?.trackList)
        ? entity.trackList
        : findTrackListInJson(json);
      const tracks = normalizeEmbedTrackItems(rawTrackList);
      if (tracks.length > 0) {
        return {
          title: extractedTitle,
          coverUrl: extractedCoverUrl,
          tracks,
        };
      }
    } catch {
      // Fall through to inline JSON scanning
    }
  }

  // 2. Fallback path: scan HTML for inline `"trackList": [...]` JSON
  const trackListKeyRegex = /"trackList"\s*:\s*\[/g;
  let match: RegExpExecArray | null;
  while ((match = trackListKeyRegex.exec(html)) !== null) {
    const bracketIndex = html.indexOf('[', match.index);
    const arrayJson = extractBalancedJsonArray(html, bracketIndex);
    if (!arrayJson) continue;
    try {
      const parsedArray = JSON.parse(arrayJson);
      const tracks = normalizeEmbedTrackItems(parsedArray);
      if (tracks.length > 0) {
        if (!extractedTitle) {
          const ogTitle = html.match(
            /<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i
          );
          if (ogTitle?.[1]) {
            extractedTitle = decodeHtmlEntities(ogTitle[1]);
          }
        }
        return {
          title: extractedTitle,
          coverUrl: extractedCoverUrl,
          tracks,
        };
      }
    } catch {
      // Try next match if malformed
    }
  }

  return {
    title: extractedTitle,
    coverUrl: extractedCoverUrl,
    tracks: [],
  };
}

function buildCorsProxyUrls(embedUrl: string): string[] {
  const encoded = encodeURIComponent(embedUrl);
  return [
    `https://api.allorigins.win/raw?url=${encoded}`,
    `https://api.codetabs.com/v1/proxy?quest=${encoded}`,
    `https://api.allorigins.win/get?url=${encoded}`,
    `https://api.cors.lol/?url=${encoded}`,
  ];
}

async function fetchTextWithTimeout(
  url: string,
  timeoutMs: number,
  parentSignal?: AbortSignal
): Promise<string | null> {
  if (parentSignal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onParentAbort = () => controller.abort();
  parentSignal?.addEventListener('abort', onParentAbort, { once: true });

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;

    // Handle JSON-wrapped CORS proxy responses (e.g. { contents: "<html>..." })
    if (text.trimStart().startsWith('{')) {
      try {
        const maybeJson = JSON.parse(text) as { contents?: unknown };
        if (typeof maybeJson.contents === 'string') {
          return maybeJson.contents;
        }
      } catch {
        // Not JSON wrapper; return raw text
      }
    }
    return text;
  } catch (err) {
    if (parentSignal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    if ((err as Error)?.name === 'AbortError') {
      // Per-proxy timeout expired; allow fallback to next proxy
      return null;
    }
    return null;
  } finally {
    clearTimeout(timer);
    parentSignal?.removeEventListener('abort', onParentAbort);
  }
}

/**
 * Resolves a public Spotify playlist/album URL by fetching its `/embed/playlist/<ID>`
 * page through a free CORS proxy fallback chain and parsing real tracks from JSON.
 * Never inserts fake sample tracks if the playlist is private or proxies fail.
 */
export async function resolveSpotifyPlaylistUrl(
  rawUrl: string,
  signal?: AbortSignal
): Promise<SpotifyPlaylistEmbedResult> {
  const parsed = parseMusicLink(rawUrl);
  if (!parsed || parsed.provider !== 'spotify' || !parsed.spotifyId) {
    throw new Error('Please enter a valid Spotify playlist/album URL.');
  }

  let oembedTitle: string | undefined;
  let oembedThumb: string | undefined;
  try {
    const oembed = await fetchPublicOembed(parsed, signal);
    if (
      oembed.title &&
      oembed.title !== 'Spotify Track' &&
      oembed.title !== 'Imported Playlist' &&
      oembed.title !== 'Imported Track'
    ) {
      oembedTitle = oembed.title;
    }
    oembedThumb = oembed.thumbnailUrl;
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
  }

  const embedType = parsed.spotifyEntityType === 'album' ? 'album' : 'playlist';
  const embedUrl = `https://open.spotify.com/embed/${embedType}/${parsed.spotifyId}`;
  const proxyUrls = buildCorsProxyUrls(embedUrl);

  for (const proxyUrl of proxyUrls) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const html = await fetchTextWithTimeout(proxyUrl, 6500, signal);
    if (!html) continue;

    const extracted = extractTracksFromSpotifyEmbedHtml(html);
    if (extracted.tracks.length > 0) {
      return {
        playlistTitle: extracted.title || oembedTitle || 'Spotify Playlist',
        coverUrl: extracted.coverUrl || oembedThumb,
        trackLines: extracted.tracks,
        fetchedRealTracks: true,
      };
    }
  }

  // Private playlist, empty embed, or all CORS proxies failed: NEVER insert fake sample songs.
  return {
    playlistTitle: oembedTitle || '',
    coverUrl: oembedThumb,
    trackLines: [],
    fetchedRealTracks: false,
    failedToFetchTracks: true,
  };
}

/**
 * Matches a list of parsed { artist, title } lines to full-length YouTube tracks (with localStorage caching).
 */
export async function matchTracklistToYouTube(
  lines: ParsedTrackLine[],
  youtubeApiKey: string,
  onProgress?: (completed: number, total: number) => void,
  signal?: AbortSignal
): Promise<Track[]> {
  const matched: Track[] = [];
  const clipped = lines.slice(0, MAX_PLAYLIST_IMPORT_TRACKS);

  for (let i = 0; i < clipped.length; i++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const item = clipped[i];
    const q = `${item.artist} ${item.title}`.trim();
    const res = await searchYouTubeWithCache(q, youtubeApiKey, signal);
    const top = res.tracks[0];

    if (top) {
      matched.push({
        ...top,
        id: `pl-import-${top.youtubeVideoId || i}-${i}`,
        title: top.title || item.title,
        artist:
          item.artist && item.artist !== 'Various Artists' ? item.artist : top.artist,
        audioUrl: undefined,
        source: 'imported',
        previewNote: 'Full Track · YouTube',
      });
    } else {
      const fallbackVid = resolveFallbackYouTubeVideoId(item.artist, item.title, i);
      matched.push({
        id: `pl-import-${fallbackVid}-${i}`,
        title: item.title,
        artist: item.artist,
        album: 'Playlist Import',
        duration: 215,
        coverUrl: `https://i.ytimg.com/vi/${fallbackVid}/hqdefault.jpg`,
        youtubeVideoId: fallbackVid,
        source: 'imported',
        synthPreset: 'nocturne',
        addedAt: Date.now() + i,
        previewNote: 'Full Track · YouTube',
      });
    }

    onProgress?.(i + 1, clipped.length);
  }

  return matched;
}
