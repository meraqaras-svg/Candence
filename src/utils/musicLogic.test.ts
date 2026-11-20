import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  formatFileSize,
  parseLocalFilename,
  upscaleItunesArtwork,
  getGreetingByHour,
} from './formatters';
import {
  DEFAULT_HOME_LAYOUT,
  toggleWidgetVisibility,
  moveWidget,
  reorderWidgets,
  normalizeLayout,
} from './layoutManager';
import {
  parseLyrics,
  hasSyncedTimestamps,
  getActiveLyricIndex,
} from './lyricsParser';
import {
  parseMusicLink,
  parseIso8601Duration,
  cleanYouTubeTitle,
  normalizeSearchQuery,
  parseTracklistText,
  getEffectiveYouTubeApiKey,
  sanitizeFullLengthTracks,
  extractTracksFromSpotifyEmbedHtml,
  resolveSpotifyPlaylistUrl,
} from './youtubeAndOembed';
import {
  computeThemeCssVariables,
  getLocalizedAccentOptions,
  resolveEffectiveAccentDefinition,
} from './ambientColor';
import {
  DEFAULT_THEME_PREFS,
  buildLyricsCacheKey,
  loadAppLanguage,
  saveAppLanguage,
} from './storage';
import {
  DEFAULT_FIREBASE_CONFIG,
  mapFirebaseAuthError,
  mapFirestoreError,
  resolveFirebaseConfig,
  sanitizeCloudSyncPayload,
  validateEmailPasswordInput,
} from './firebaseSync';
import {
  AD_TRIGGER_INTERVAL,
  ADMIN_EMAIL,
  generatePromoCode,
  isAdminEmail,
  isUserAdFree,
  normalizePromoCode,
  shouldPlayAudioAd,
} from './audioAdEngine';
import { getLocalizedGreeting, getTranslations } from './i18n';

test('formatTime handles normal, zero, and invalid inputs', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(9), '0:09');
  assert.equal(formatTime(125.9), '2:05');
  assert.equal(formatTime(-5), '0:00');
  assert.equal(formatTime(Number.NaN), '0:00');
});

test('formatFileSize formats KB and MB cleanly', () => {
  assert.equal(formatFileSize(undefined), '');
  assert.equal(formatFileSize(512000), '500 KB');
  assert.equal(formatFileSize(3 * 1024 * 1024), '3.0 MB');
});

test('parseLocalFilename extracts artist and title when hyphen separated', () => {
  assert.deepEqual(parseLocalFilename('Daft Punk - Voyager.mp3'), {
    artist: 'Daft Punk',
    title: 'Voyager',
  });
  assert.deepEqual(parseLocalFilename('late_night_sketch.wav'), {
    artist: 'Local File',
    title: 'late night sketch',
  });
});

test('upscaleItunesArtwork replaces 100x100bb with 600x600bb', () => {
  assert.equal(
    upscaleItunesArtwork('https://is1-ssl.mzstatic.com/image/thumb/Music/100x100bb.jpg'),
    'https://is1-ssl.mzstatic.com/image/thumb/Music/600x600bb.jpg'
  );
  assert.equal(upscaleItunesArtwork(undefined), undefined);
});

test('getGreetingByHour returns appropriate time-of-day greeting', () => {
  assert.equal(getGreetingByHour(8), 'Good Morning');
  assert.equal(getGreetingByHour(14), 'Good Afternoon');
  assert.equal(getGreetingByHour(21), 'Good Evening');
});

test('layoutManager defaults to 3 visual Home widgets (Quick Picks, Recently Played, Playlists) and toggles/reorders cleanly', () => {
  assert.equal(DEFAULT_HOME_LAYOUT.length, 3);
  assert.equal(DEFAULT_HOME_LAYOUT[0].id, 'quick-picks');
  assert.equal(DEFAULT_HOME_LAYOUT[1].id, 'recently-played');
  assert.equal(DEFAULT_HOME_LAYOUT[2].id, 'playlists');

  const hidden = toggleWidgetVisibility(DEFAULT_HOME_LAYOUT, 'playlists');
  assert.equal(hidden.find((w) => w.id === 'playlists')?.visible, false);

  const movedUp = moveWidget(DEFAULT_HOME_LAYOUT, 'recently-played', 'up');
  assert.equal(movedUp[0].id, 'recently-played');
  assert.equal(movedUp[1].id, 'quick-picks');

  const noopUp = moveWidget(movedUp, 'recently-played', 'up');
  assert.deepEqual(
    noopUp.map((w) => w.id),
    movedUp.map((w) => w.id)
  );

  const reordered = reorderWidgets(DEFAULT_HOME_LAYOUT, 2, 0);
  assert.equal(reordered[0].id, 'playlists');
});

test('normalizeLayout recovers from partial or legacy local-files saved arrays', () => {
  const partial = [{ id: 'playlists', visible: false }, { id: 'local-files', visible: true }];
  const normalized = normalizeLayout(partial);
  assert.equal(normalized.length, 3);
  assert.equal(normalized[0].id, 'playlists');
  assert.equal(normalized[0].visible, false);
  assert.ok(normalized.some((w) => w.id === 'quick-picks' && w.visible === true));
});

test('lyricsParser parses LRC timestamps and locates active lyric index', () => {
  const sample = `[ar:Test Artist]
[00:01.00] First line
[00:05.50] Second line
[00:12.00] Third line`;

  const lines = parseLyrics(sample);
  assert.equal(lines.length, 3);
  assert.equal(hasSyncedTimestamps(lines), true);
  assert.equal(lines[0].time, 1);
  assert.equal(lines[1].time, 5.5);

  assert.equal(getActiveLyricIndex(lines, 0.2), -1);
  assert.equal(getActiveLyricIndex(lines, 1.0), 0);
  assert.equal(getActiveLyricIndex(lines, 6.0), 1);
  assert.equal(getActiveLyricIndex(lines, 15.0), 2);
});

test('parseMusicLink parses YouTube, YouTube Music, and Spotify track/playlist URLs', () => {
  const yt = parseMusicLink('https://www.youtube.com/watch?v=a5uQMwRMHcs');
  assert.equal(yt?.provider, 'youtube');
  assert.equal(yt?.youtubeVideoId, 'a5uQMwRMHcs');
  assert.equal(yt?.kind, 'track');

  const ytm = parseMusicLink('https://music.youtube.com/watch?v=2SUwOgmvzK4&list=RDAMVM2SUwOgmvzK4');
  assert.equal(ytm?.provider, 'youtube-music');
  assert.equal(ytm?.youtubeVideoId, '2SUwOgmvzK4');

  const shortYt = parseMusicLink('https://youtu.be/4NRXx6U8ABQ');
  assert.equal(shortYt?.provider, 'youtube');
  assert.equal(shortYt?.youtubeVideoId, '4NRXx6U8ABQ');

  const spTrack = parseMusicLink('https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b?si=123');
  assert.equal(spTrack?.provider, 'spotify');
  assert.equal(spTrack?.kind, 'track');
  assert.equal(spTrack?.spotifyId, '0VjIjW4GlUZAMYd2vXMi3b');

  const spPlaylist = parseMusicLink('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M');
  assert.equal(spPlaylist?.provider, 'spotify');
  assert.equal(spPlaylist?.kind, 'playlist');

  assert.equal(parseMusicLink('not a url at all'), null);
});

test('parseIso8601Duration converts YouTube PT durations to seconds', () => {
  assert.equal(parseIso8601Duration('PT3M45S'), 225);
  assert.equal(parseIso8601Duration('PT1H2M10S'), 3730);
  assert.equal(parseIso8601Duration('PT48S'), 48);
  assert.equal(parseIso8601Duration('invalid'), 0);
});

test('cleanYouTubeTitle strips noise suffixes and extracts Artist - Title', () => {
  const res = cleanYouTubeTitle(
    'Daft Punk - Instant Crush (Official Video) [HD]',
    'DaftPunkVEVO'
  );
  assert.deepEqual(res, {
    artist: 'Daft Punk',
    title: 'Instant Crush',
  });

  const topicRes = cleanYouTubeTitle('Everything In Its Right Place', 'Radiohead - Topic');
  assert.deepEqual(topicRes, {
    artist: 'Radiohead',
    title: 'Everything In Its Right Place',
  });

  assert.equal(normalizeSearchQuery('  Daft   Punk  '), 'daft punk');
});

test('parseTracklistText parses Artist - Song Title, numbered lines, and CSV rows', () => {
  const raw = `
# Artist, Title
1. Daft Punk - Instant Crush
2) Tame Impala — The Less I Know The Better
"The Weeknd", "Blinding Lights"
Radiohead, Everything In Its Right Place
`;
  const parsed = parseTracklistText(raw);
  assert.equal(parsed.length, 4);
  assert.deepEqual(parsed[0], { artist: 'Daft Punk', title: 'Instant Crush' });
  assert.deepEqual(parsed[1], {
    artist: 'Tame Impala',
    title: 'The Less I Know The Better',
  });
  assert.deepEqual(parsed[2], { artist: 'The Weeknd', title: 'Blinding Lights' });
  assert.deepEqual(parsed[3], {
    artist: 'Radiohead',
    title: 'Everything In Its Right Place',
  });
});

test('sanitizeFullLengthTracks strips 30s preview audioUrls and attaches full-length YouTube IDs', () => {
  const legacyPreviewTrack = {
    id: 'itunes-123',
    title: 'Instant Crush',
    artist: 'Daft Punk',
    album: 'Random Access Memories',
    duration: 30,
    audioUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview123.m4a',
    source: 'itunes' as const,
    addedAt: 1000,
  };

  const [sanitized] = sanitizeFullLengthTracks([legacyPreviewTrack]);
  assert.equal(sanitized.audioUrl, undefined);
  assert.equal(sanitized.source, 'youtube');
  assert.equal(sanitized.youtubeVideoId, 'a5uQMwRMHcs');
  assert.ok(sanitized.duration > 180);
});

test('getEffectiveYouTubeApiKey respects settings override and falls back cleanly', () => {
  const withSettings = getEffectiveYouTubeApiKey('AIzaCustomOverrideKey');
  assert.equal(withSettings.key, 'AIzaCustomOverrideKey');
  assert.equal(withSettings.source, 'override');
});

test('Theme Customizer computes CSS variables and resolves Auto from Album Art accent', () => {
  const emeraldVars = computeThemeCssVariables(
    {
      ...DEFAULT_THEME_PREFS,
      accentColor: 'emerald',
      glassIntensity: 100,
      ambientGlowEnabled: false,
    },
    null
  );
  assert.equal(emeraldVars['--color-rose-500'], '#10b981');
  assert.equal(emeraldVars['--glass-blur'], '60px');
  assert.equal(emeraldVars['--ambient-glow-opacity'], '0');

  const autoHorizonDef = resolveEffectiveAccentDefinition('auto', {
    id: 'seed-2',
    title: 'Velvet Horizon',
    artist: 'Maren Solberg',
    album: 'Tidal Glass',
    duration: 218,
    source: 'curated',
    synthPreset: 'horizon',
    addedAt: 1,
  });
  assert.equal(autoHorizonDef.id, 'blue');
});

test('sanitizeCloudSyncPayload strips undefined fields and local blobs for Firestore rules compliance', () => {
  const sanitized = sanitizeCloudSyncPayload({
    playlists: [
      {
        id: 'pl-1',
        name: 'Night Drive',
        description: 'Synth mix',
        coverUrl: undefined,
        trackIds: ['seed-1', 'seed-2'],
        createdAt: 12345,
      },
    ],
    favoriteIds: ['seed-1', 'seed-1', 'seed-2'],
    themePrefs: DEFAULT_THEME_PREFS,
    homeLayout: DEFAULT_HOME_LAYOUT,
    savedTracks: [
      {
        id: 'local-1',
        title: 'Local MP3',
        artist: 'Me',
        album: 'Local',
        duration: 180,
        source: 'local',
        addedAt: 100,
      },
      {
        id: 'yt-1',
        title: 'Instant Crush',
        artist: 'Daft Punk',
        album: 'RAM',
        duration: 337,
        youtubeVideoId: 'a5uQMwRMHcs',
        source: 'youtube',
        addedAt: 200,
      },
    ],
  });

  assert.equal('coverUrl' in sanitized.playlists[0], false);
  assert.deepEqual(sanitized.favoriteIds, ['seed-1', 'seed-2']);
  assert.equal(sanitized.savedTracks.length, 1);
  assert.equal(sanitized.savedTracks[0].id, 'yt-1');
});

test('resolveFirebaseConfig reads env first, strips quotes/whitespace, enforces AIza prefix, and falls back to muzikapptone-c6971', () => {
  const fallbackCfg = resolveFirebaseConfig();
  assert.equal(fallbackCfg.apiKey, 'AIzaSyCFU6YRhTCVyzJJXZcDF14IFKhRs8eemT0');
  assert.equal(fallbackCfg.authDomain, 'muzikapptone-c6971.firebaseapp.com');
  assert.equal(fallbackCfg.projectId, 'muzikapptone-c6971');
  assert.equal(fallbackCfg.storageBucket, 'muzikapptone-c6971.firebasestorage.app');
  assert.equal(fallbackCfg.messagingSenderId, '49571646885');
  assert.equal(fallbackCfg.appId, '1:49571646885:web:e044ff2b4ec431fae0494c');
  assert.equal(fallbackCfg.firestoreDatabaseId, '(default)');
  assert.deepEqual(fallbackCfg, DEFAULT_FIREBASE_CONFIG);

  const overrideCfg = resolveFirebaseConfig({
    VITE_FIREBASE_PROJECT_ID: '  "custom-override-project"  ',
    VITE_FIREBASE_API_KEY: " 'AIzaCustomValidKey123' ",
    VITE_FIREBASE_AUTH_DOMAIN: ' "custom.firebaseapp.com" ',
  });
  assert.equal(overrideCfg.projectId, 'custom-override-project');
  assert.equal(overrideCfg.apiKey, 'AIzaCustomValidKey123');
  assert.equal(overrideCfg.authDomain, 'custom.firebaseapp.com');

  const nonAizaCfg = resolveFirebaseConfig({
    VITE_FIREBASE_API_KEY: '"not-starting-with-aiza"',
  });
  assert.equal(nonAizaCfg.apiKey, DEFAULT_FIREBASE_CONFIG.apiKey);
});

test('validateEmailPasswordInput enforces email format and password rules in Turkish and English', () => {
  assert.equal(
    validateEmailPasswordInput('', '123456', 'signin', 'tr'),
    'Lütfen e-posta adresinizi girin.'
  );
  assert.equal(
    validateEmailPasswordInput('not-an-email', '123456', 'signin', 'tr'),
    'Geçerli bir e-posta adresi girin.'
  );
  assert.equal(
    validateEmailPasswordInput('test@cadence.app', '', 'signin', 'tr'),
    'Lütfen şifrenizi girin.'
  );
  assert.equal(
    validateEmailPasswordInput('test@cadence.app', '123', 'signup', 'tr'),
    'Şifre çok zayıf. En az 6 karakter olmalıdır.'
  );
  assert.equal(
    validateEmailPasswordInput('test@cadence.app', '123456', 'signup', 'tr'),
    null
  );
  assert.equal(
    validateEmailPasswordInput('test@cadence.app', '123', 'signup', 'en'),
    'Password is too weak. Use at least 6 characters.'
  );
});

test('mapFirebaseAuthError and mapFirestoreError return clear Turkish and English messages with raw details in Turkish', () => {
  assert.equal(
    mapFirebaseAuthError({ code: 'auth/wrong-password' }, 'tr'),
    'Hatalı e-posta adresi veya şifre. Lütfen bilgilerinizi kontrol edin. (auth/wrong-password)'
  );
  assert.equal(
    mapFirebaseAuthError(
      { code: 'auth/invalid-api-key', message: 'Firebase: Error (auth/invalid-api-key).' },
      'tr'
    ),
    'Firebase API anahtarı geçersiz. Lütfen proje yapılandırmasını kontrol edin. (auth/invalid-api-key: Firebase: Error (auth/invalid-api-key).)'
  );
  assert.equal(
    mapFirebaseAuthError({ code: 'auth/weak-password' }, 'tr'),
    'Şifre çok zayıf. En az 6 karakter kullanın. (auth/weak-password)'
  );
  assert.equal(
    mapFirebaseAuthError({ code: 'auth/email-already-in-use' }, 'tr'),
    'Bu e-posta adresi zaten kullanımda. Giriş yapmayı deneyin. (auth/email-already-in-use)'
  );
  assert.equal(
    mapFirebaseAuthError({ code: 'auth/unauthorized-domain' }, 'tr'),
    'Bu alan adı Firebase Authentication ayarlarında yetkilendirilmemiş (Yetkili alan adlarına ekleyin). (auth/unauthorized-domain)'
  );
  assert.equal(
    mapFirebaseAuthError({ code: 'auth/wrong-password' }, 'en'),
    'Incorrect email or password. Please check your credentials.'
  );

  assert.equal(
    mapFirestoreError({ code: 'permission-denied', message: 'Missing or insufficient permissions.' }, 'tr'),
    'Firestore erişim izni reddedildi. Lütfen Firestore güvenlik kurallarının (users/{uid}) oturum açmış kullanıcıya izin verdiğinden emin olun.'
  );
  assert.equal(
    mapFirestoreError({ code: 'unavailable' }, 'tr'),
    'Firestore veritabanına şu anda ulaşılamıyor. İnternet bağlantınızı kontrol edin.'
  );
  assert.equal(
    mapFirestoreError({ code: 'permission-denied' }, 'en'),
    'Firestore permission denied. Check that security rules allow signed-in users to access users/{uid}.'
  );
});

test('Turkish i18n dictionary, greetings, accent labels, and language storage default to tr cleanly', () => {
  assert.equal(loadAppLanguage(), 'tr');
  // Calling saveAppLanguage in Node (without window.localStorage) should safely no-op
  assert.doesNotThrow(() => saveAppLanguage('en'));

  const tr = getTranslations('tr');
  const en = getTranslations('en');
  assert.equal(tr.authTabSignIn, 'Giriş Yap');
  assert.equal(tr.authTabSignUp, 'Kayıt Ol');
  assert.equal(en.authTabSignIn, 'Sign In');

  assert.equal(getLocalizedGreeting(9, 'tr'), 'Günaydın');
  assert.equal(getLocalizedGreeting(14, 'tr'), 'İyi Günler');
  assert.equal(getLocalizedGreeting(21, 'tr'), 'İyi Akşamlar');
  assert.equal(getLocalizedGreeting(9, 'en'), 'Good Morning');

  const trAccents = getLocalizedAccentOptions('tr');
  assert.equal(trAccents.find((a) => a.id === 'rose')?.label, 'Gül Kırmızısı');
  assert.equal(trAccents.find((a) => a.id === 'auto')?.label, 'Albüm Kapağından Otomatik');
});

test('parseTracklistText parses Exportify CSV headers and quoted commas cleanly', () => {
  const exportifyCsv = `\uFEFFTrack URI,Track Name,Album Name,Artist Name(s),Release Date,Duration (ms)
spotify:track:1,"Instant Crush","Random Access Memories","Daft Punk, Julian Casablancas",2013-05-17,337560
spotify:track:2,"Hello, Goodbye","Magical Mystery Tour",The Beatles,1967-11-27,207000
`;
  const parsed = parseTracklistText(exportifyCsv);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], {
    artist: 'Daft Punk, Julian Casablancas',
    title: 'Instant Crush',
  });
  assert.deepEqual(parsed[1], {
    artist: 'The Beatles',
    title: 'Hello, Goodbye',
  });
});

test('extractTracksFromSpotifyEmbedHtml parses __NEXT_DATA__, inline trackList JSON, and private/empty HTML', () => {
  const nextDataHtml = `<!doctype html><html><head></head><body>
    <script type="application/json" id="__NEXT_DATA__">${JSON.stringify({
      props: {
        pageProps: {
          state: {
            data: {
              entity: {
                name: 'İstanbul Akşamları &amp; Akustik',
                coverArt: { sources: [{ url: 'https://i.scdn.co/image/cover123' }] },
                trackList: [
                  { title: 'Aşkın Olayım', subtitle: 'Simge' },
                  { title: 'Kuzu Kuzu', subtitle: 'Tarkan\u00a0' },
                ],
              },
            },
          },
        },
      },
    })}</script>
  </body></html>`;

  const fromNextData = extractTracksFromSpotifyEmbedHtml(nextDataHtml);
  assert.equal(fromNextData.title, 'İstanbul Akşamları & Akustik');
  assert.equal(fromNextData.coverUrl, 'https://i.scdn.co/image/cover123');
  assert.deepEqual(fromNextData.tracks, [
    { artist: 'Simge', title: 'Aşkın Olayım' },
    { artist: 'Tarkan', title: 'Kuzu Kuzu' },
  ]);

  const inlineHtml = `<html><head><meta property="og:title" content="Gece Sürüşü" /></head><body>
    <script>window.__EMBED__={"entity":{"trackList":[{"title":"Midnight City","subtitle":"M83","artists":[{"name":"M83"}]},{"title":"Nightcall [Remix]","subtitle":"Kavinsky"}]}};</script>
  </body></html>`;
  const fromInline = extractTracksFromSpotifyEmbedHtml(inlineHtml);
  assert.equal(fromInline.title, 'Gece Sürüşü');
  assert.deepEqual(fromInline.tracks, [
    { artist: 'M83', title: 'Midnight City' },
    { artist: 'Kavinsky', title: 'Nightcall [Remix]' },
  ]);

  const privateHtml = '<html><body><h1>Playlist not available</h1></body></html>';
  const fromPrivate = extractTracksFromSpotifyEmbedHtml(privateHtml);
  assert.deepEqual(fromPrivate.tracks, []);
});

test('resolveSpotifyPlaylistUrl uses CORS proxy fallback chain for real tracks and returns empty (never sample tracks) when all proxies fail', async () => {
  const originalFetch = globalThis.fetch;
  const requestedUrls: string[] = [];

  try {
    // 1. Proxy fallback: allorigins fails (503), codetabs succeeds with real embed HTML
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes('open.spotify.com/oembed')) {
        return new Response(
          JSON.stringify({
            title: 'Anadolu Rock Klasikleri',
            thumbnail_url: 'https://i.scdn.co/image/anadolu',
          }),
          { status: 200 }
        );
      }
      if (url.includes('api.allorigins.win')) {
        return new Response('Service Unavailable', { status: 503 });
      }
      if (url.includes('api.codetabs.com')) {
        return new Response(
          `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
            props: {
              pageProps: {
                state: {
                  data: {
                    entity: {
                      name: 'Anadolu Rock Klasikleri',
                      trackList: [
                        { title: 'Gülpembe', subtitle: 'Barış Manço' },
                        { title: 'Tamirci Çırağı', subtitle: 'Cem Karaca' },
                      ],
                    },
                  },
                },
              },
            },
          })}</script>`,
          { status: 200 }
        );
      }
      return new Response('Not found', { status: 404 });
    }) as typeof fetch;

    const successResult = await resolveSpotifyPlaylistUrl(
      'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=test123'
    );
    assert.equal(successResult.fetchedRealTracks, true);
    assert.equal(successResult.playlistTitle, 'Anadolu Rock Klasikleri');
    assert.equal(successResult.coverUrl, 'https://i.scdn.co/image/anadolu');
    assert.deepEqual(successResult.trackLines, [
      { artist: 'Barış Manço', title: 'Gülpembe' },
      { artist: 'Cem Karaca', title: 'Tamirci Çırağı' },
    ]);
    assert.ok(
      requestedUrls.some((u) =>
        u.includes('api.allorigins.win/raw?url=https%3A%2F%2Fopen.spotify.com%2Fembed%2Fplaylist%2F37i9dQZF1DXcBWIGoYBM5M')
      )
    );
    assert.ok(
      requestedUrls.some((u) =>
        u.includes('api.codetabs.com/v1/proxy?quest=https%3A%2F%2Fopen.spotify.com%2Fembed%2Fplaylist%2F37i9dQZF1DXcBWIGoYBM5M')
      )
    );

    // 2. All proxies fail / private playlist: NEVER returns fake sample tracks
    globalThis.fetch = (async () => new Response('Forbidden', { status: 403 })) as typeof fetch;
    const failResult = await resolveSpotifyPlaylistUrl(
      'https://open.spotify.com/playlist/private123456789'
    );
    assert.equal(failResult.fetchedRealTracks, false);
    assert.equal(failResult.failedToFetchTracks, true);
    assert.deepEqual(failResult.trackLines, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('NYXON admin email check strictly grants admin only to meraqaras@gmail.com', () => {
  assert.equal(ADMIN_EMAIL, 'meraqaras@gmail.com');
  assert.equal(isAdminEmail('meraqaras@gmail.com'), true);
  assert.equal(isAdminEmail('  MERAQARAS@GMAIL.COM  '), true);
  assert.equal(isAdminEmail('other@gmail.com'), false);
  assert.equal(isAdminEmail('meraqaras@gmail.com.evil.tld'), false);
  assert.equal(isAdminEmail(null), false);
  assert.equal(isAdminEmail(undefined), false);
});

test('NYXON Audio Ad cadence triggers every 3 songs for free users and never for Pro or Admin', () => {
  assert.equal(AD_TRIGGER_INTERVAL, 3);
  assert.equal(isUserAdFree('free', 'listener@nyxon.app'), false);
  assert.equal(isUserAdFree('pro', 'listener@nyxon.app'), true);
  assert.equal(isUserAdFree('free', 'meraqaras@gmail.com'), true);

  assert.equal(shouldPlayAudioAd({ plan: 'free', email: 'listener@nyxon.app', songsSinceLastAd: 1 }), false);
  assert.equal(shouldPlayAudioAd({ plan: 'free', email: 'listener@nyxon.app', songsSinceLastAd: 2 }), false);
  assert.equal(shouldPlayAudioAd({ plan: 'free', email: 'listener@nyxon.app', songsSinceLastAd: 3 }), true);

  // Bypassed for Pro and Admin even at 3+ songs
  assert.equal(shouldPlayAudioAd({ plan: 'pro', email: 'listener@nyxon.app', songsSinceLastAd: 3 }), false);
  assert.equal(shouldPlayAudioAd({ plan: 'free', email: 'meraqaras@gmail.com', songsSinceLastAd: 9 }), false);
});

test('NYXON promo code generator, normalizer, offline lyrics cache key, and Turkish rebrand dictionary work cleanly', () => {
  const code = generatePromoCode();
  assert.match(code, /^NYXON-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
  assert.equal(normalizePromoCode('  nyxon - ab12 - cd34  '), 'NYXON-AB12-CD34');

  const key = buildLyricsCacheKey('yt-123', 'Daft Punk', 'Instant Crush');
  assert.equal(key, 'daft punk::instant crush');
  assert.equal(buildLyricsCacheKey('local-99', '', ''), 'local-99');

  const tr = getTranslations('tr');
  const en = getTranslations('en');
  assert.equal(tr.appName, 'NYXON');
  assert.equal(en.appName, 'NYXON');
  assert.ok(tr.authWelcomeTitle.includes('NYXON'));
  assert.equal(tr.adBannerLabel, 'Sponsorlu Sesli Reklam');
  assert.equal(tr.proModalTitle, 'NYXON Pro');
  assert.equal(tr.adminModalTitle, 'NYXON Admin Paneli');
});



