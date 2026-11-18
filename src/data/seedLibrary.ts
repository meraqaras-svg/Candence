import coverNocturne from '../assets/images/cover_nocturne_vinyl_1794908625754.jpg';
import coverHorizon from '../assets/images/cover_velvet_horizon_1794908626299.jpg';
import coverChrome from '../assets/images/cover_chrome_echoes_1794908627194.jpg';
import coverAmber from '../assets/images/cover_amber_tape_1794908627379.jpg';
import type { Playlist, Track } from '../types/music';

export const SEED_TRACKS: Track[] = [
  {
    id: 'curated-nocturne-prism',
    title: 'Glass Prism Nocturne',
    artist: 'Kaito Vance',
    album: 'Refraction Studies',
    duration: 214,
    coverUrl: coverNocturne,
    youtubeVideoId: 'a5uQMwRMHcs',
    source: 'curated',
    synthPreset: 'nocturne',
    previewNote: 'Full Track · YouTube',
    addedAt: 1730000001000,
    lyrics: `[00:00.50] Amber light across the slate
[00:04.20] Quiet shadows bend and wait
[00:08.50] Through the glass the chords unfold
[00:12.60] Warm reflections turn to gold
[00:16.80] Hold the silence in the room
[00:20.40] Soft frequencies begin to bloom`,
  },
  {
    id: 'curated-velvet-horizon',
    title: 'Velvet Horizon',
    artist: 'Maren Solberg',
    album: 'Blue Hour Tides',
    duration: 218,
    coverUrl: coverHorizon,
    youtubeVideoId: '2SUwOgmvzK4',
    source: 'curated',
    synthPreset: 'horizon',
    previewNote: 'Full Track · YouTube',
    addedAt: 1730000002000,
    lyrics: `[00:00.50] Silver ripples on the bay
[00:04.60] Dusk dissolves the edge of day
[00:09.00] Drift beyond the harbor line
[00:13.20] Static fades to ocean time
[00:17.50] Beneath the low and open sky
[00:21.00] Let the slow tide carry by`,
  },
  {
    id: 'curated-chrome-echoes',
    title: 'Monolith in Chrome',
    artist: 'Sora Takahashi',
    album: 'Brutalist Harmonics',
    duration: 251,
    coverUrl: coverChrome,
    youtubeVideoId: 'NUnXxh5U25Y',
    source: 'curated',
    synthPreset: 'chrome',
    previewNote: 'Full Track · YouTube',
    addedAt: 1730000003000,
    lyrics: `[00:00.50] Brushed aluminum and stone
[00:04.50] Echoes ringing out alone
[00:08.80] Sharp geometry of sound
[00:13.00] Resonating underground
[00:17.20] Every angle catches light
[00:20.80] Sculpted stillness in the night`,
  },
  {
    id: 'curated-amber-tape',
    title: 'Copper Reel 60',
    artist: 'Julian Mercer',
    album: 'Analog Tape Loops',
    duration: 201,
    coverUrl: coverAmber,
    youtubeVideoId: 'V1Pl8CzNzCw',
    source: 'curated',
    synthPreset: 'amber',
    previewNote: 'Full Track · YouTube',
    addedAt: 1730000004000,
    lyrics: `[00:00.50] Magnetic ribbon turning slow
[00:04.40] Dusty warmth from long ago
[00:08.60] Handwritten label on the side
[00:12.80] Every hiss we let reside
[00:17.00] Side B plays until the dawn
[00:20.80] Gentle memories linger on`,
  },
];

export const SEED_PLAYLISTS: Playlist[] = [
  {
    id: 'pl-midnight-glass',
    name: 'Midnight Glass',
    description: 'Minimal ambient tones and late-night harmonic textures.',
    coverUrl: coverNocturne,
    trackIds: ['curated-nocturne-prism', 'curated-velvet-horizon', 'curated-chrome-echoes'],
    createdAt: 1730000001000,
  },
  {
    id: 'pl-analog-focus',
    name: 'Analog Focus',
    description: 'Warm tape loops and architectural soundscapes for deep work.',
    coverUrl: coverAmber,
    trackIds: ['curated-amber-tape', 'curated-chrome-echoes', 'curated-nocturne-prism'],
    createdAt: 1730000002000,
  },
  {
    id: 'pl-coastal-drift',
    name: 'Coastal Drift',
    description: 'Horizon washes and calm twilight progressions.',
    coverUrl: coverHorizon,
    trackIds: ['curated-velvet-horizon', 'curated-amber-tape'],
    createdAt: 1730000003000,
  },
];

export const DEFAULT_RECENT_IDS = [
  'curated-nocturne-prism',
  'curated-velvet-horizon',
  'curated-amber-tape',
  'curated-chrome-echoes',
];

export const SUGGESTED_SEARCHES = [
  'Daft Punk',
  'Radiohead',
  'Tame Impala',
  'Fred again',
  'Billie Eilish',
  'Miles Davis',
];
