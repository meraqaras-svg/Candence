import type { AppLanguage, HomeWidgetId } from '../types/music';

export interface TranslationDictionary {
  // Brand & Common
  appName: string;
  cancel: string;
  save: string;
  close: string;
  delete: string;
  reset: string;
  retry: string;
  done: string;
  loading: string;
  active: string;
  off: string;
  songSingular: string;
  songPlural: string;
  songsCount: (n: number) => string;
  searchesCount: (n: number) => string;
  tracksDetected: (n: number) => string;

  // Greetings
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;

  // Auth Gate
  authWelcomeTitle: string;
  authWelcomeSubtitle: string;
  authTabSignIn: string;
  authTabSignUp: string;
  authDisplayNameLabel: string;
  authDisplayNamePlaceholder: string;
  authEmailLabel: string;
  authEmailPlaceholder: string;
  authPasswordLabel: string;
  authPasswordPlaceholder: string;
  authShowPassword: string;
  authHidePassword: string;
  authSubmitSignIn: string;
  authSubmitSignUp: string;
  authSubmitting: string;
  authDividerOr: string;
  authGoogleButton: string;
  authGoogleSigningIn: string;
  authGateNotice: string;
  authValidationEmptyEmail: string;
  authValidationInvalidEmail: string;
  authValidationEmptyPassword: string;
  authValidationWeakPassword: string;
  authSignUpVerifyHint: string;

  // Sidebar & Navigation
  navPrimaryAria: string;
  navMobileAria: string;
  navHome: string;
  navSearch: string;
  navLibrary: string;
  navImportShort: string;
  navThemeShort: string;
  actionLinkImport: string;
  actionUploadAudio: string;
  actionNewPlaylist: string;
  actionCustomizeTheme: string;
  sidebarPlaylists: string;
  sidebarCloudSynced: string;
  sidebarVerifyPending: string;
  sidebarSignOutAria: string;
  sidebarSignOutTitle: string;
  sidebarSignInGoogle: string;
  sidebarSigningIn: string;
  sidebarSettings: string;
  mobileCloudSyncAria: string;
  mobileUploadAria: string;
  mobileThemeAria: string;
  mobileSettingsAria: string;

  // Home View
  homeCustomizeButton: string;
  homeSaveLayout: string;
  homeEditInstructionsPre: string;
  homeEditInstructionsEnd: string;
  homeHiddenTitle: string;
  homeHiddenBody: string;
  homeRecentEmpty: string;
  homeCreatePlaylist: string;
  homeVisible: string;
  homeHidden: string;
  homeShown: string;
  homeMoveUpAria: (label: string) => string;
  homeMoveDownAria: (label: string) => string;
  homeHideWidgetAria: (label: string) => string;
  homeShowWidgetAria: (label: string) => string;
  widgetQuickPicks: string;
  widgetQuickPicksDesc: string;
  widgetRecentlyPlayed: string;
  widgetRecentlyPlayedDesc: string;
  widgetPlaylists: string;
  widgetPlaylistsDesc: string;

  // Track controls & menus
  playAria: (title: string) => string;
  pauseAria: (title: string) => string;
  favAddAria: (title: string) => string;
  favRemoveAria: (title: string) => string;
  moreOptionsAria: (title: string) => string;
  menuAddToUpNext: string;
  menuViewLyrics: string;
  menuAddToPlaylist: string;
  menuNewPlaylist: string;

  // Search View
  searchTitle: string;
  searchPlaceholder: string;
  searchInputAria: string;
  searchClearAria: string;
  searchButton: string;
  searchTrending: string;
  searchDiscoverTitle: string;
  searchDiscoverBody: string;
  searchBusyAria: string;
  searchError: string;
  searchInLibrary: string;
  searchTopResults: (q: string) => string;
  searchNoMatches: (q: string) => string;

  // Library View
  libraryTitle: string;
  libraryBack: string;
  libraryPlaylistLabel: string;
  libraryTotal: string;
  libraryPlayAll: string;
  libraryDeletePlaylist: string;
  libraryDeletePlaylistAria: (name: string) => string;
  libraryEmptyPlaylist: string;
  libraryRemoveFromPlaylistAria: (track: string, pl: string) => string;
  libraryTabPlaylists: (n: number) => string;
  libraryTabFavorites: (n: number) => string;
  libraryTabLocal: (n: number) => string;
  libraryEmptyFavorites: string;
  libraryDropTitle: string;
  libraryDropSubtitle: string;
  libraryChooseFiles: string;
  libraryRemoveLocalAria: (title: string) => string;

  // Player Bar
  playerBarAria: string;
  playerEmptyState: string;
  playerOpenNowPlayingAria: (title: string) => string;
  playerEnableShuffle: string;
  playerDisableShuffle: string;
  playerPrevTrack: string;
  playerNextTrack: string;
  playerPlay: string;
  playerPause: string;
  playerRepeatAria: (mode: string) => string;
  playerSeekAria: string;
  playerOpenLyricsAria: string;
  playerOpenQueueAria: string;
  playerLyricsTitle: string;
  playerUpNextTitle: string;
  playerMuteAria: string;
  playerUnmuteAria: string;
  playerVolumeAria: string;
  playerExpandAria: string;

  // Now Playing Overlay
  npDialogAria: string;
  npSwipeHandleAria: string;
  npMinimize: string;
  npMinimizeAria: string;
  npTabUpNext: string;
  npTabLyrics: string;
  npSleepTimer: string;
  npSleepShort: string;
  npMinutes: (m: number) => string;
  npSyncedSubtitle: string;
  npEditLyrics: string;
  npAddLyrics: string;
  npLyricsEditorHint: string;
  npLyricsPlaceholder: string;
  npSaveLyrics: string;
  npFetchingLyrics: string;
  npNoLyricsForTrack: (title: string) => string;
  npAddCustomLyrics: string;
  npQueueEmpty: string;
  npRemoveFromQueueAria: (title: string) => string;

  // Playlist Modal
  plModalTitle: string;
  plModalCloseAria: string;
  plModalNameLabel: string;
  plModalNamePlaceholder: string;
  plModalNameRequired: string;
  plModalDescLabel: string;
  plModalDescPlaceholder: string;
  plModalDefaultDesc: string;
  plModalCreateButton: string;

  // Settings & Theme Modal
  settingsTitle: string;
  settingsSubtitle: string;
  settingsCloseAria: string;
  settingsTabTheme: string;
  settingsTabAccount: string;
  settingsLanguageLabel: string;
  settingsLanguageDesc: string;
  settingsAccentColor: string;
  settingsGlassIntensity: string;
  settingsGlassDesc: string;
  settingsAmbientGlow: string;
  settingsAmbientDesc: string;
  settingsLayoutDensity: string;
  settingsDensityComfortable: string;
  settingsDensityCompact: string;
  settingsPlayerBarStyle: string;
  settingsPlayerDocked: string;
  settingsPlayerFloating: string;
  settingsResetTheme: string;
  settingsCloudAccountActive: string;
  settingsCloudGuest: string;
  settingsCloudSyncedDesc: string;
  settingsCloudUnverifiedDesc: string;
  settingsCloudSignInPrompt: string;
  settingsResendVerification: string;
  settingsRefreshVerification: string;
  settingsVerificationSent: string;
  settingsSignOut: string;
  settingsCompactVideoTitle: string;
  settingsCompactVideoDesc: string;
  settingsCompactVideoVisible: string;
  settingsCompactVideoHidden: string;
  settingsCacheTitle: string;
  settingsCacheDesc: string;
  settingsClearCache: string;
  settingsAdvanced: string;
  settingsAdvancedCustomKey: string;
  settingsAdvancedSecrets: string;
  settingsAdvancedDefault: string;
  settingsCustomYtKeyLabel: string;
  settingsCustomYtKeyPlaceholderSecrets: string;
  settingsCustomYtKeyPlaceholderDefault: string;
  settingsClearApiKeyAria: string;
  settingsShowApiKeyAria: string;
  settingsHideApiKeyAria: string;
  settingsSaveButton: string;

  // Link & Playlist Import Modal
  importModalTitle: string;
  importModalSubtitle: string;
  importModalCloseAria: string;
  importTabSingle: string;
  importTabPlaylist: string;
  importSingleUrlLabel: string;
  importSingleUrlErrorEmpty: string;
  importSingleUrlErrorInvalid: string;
  importMatching: string;
  importAndPlayBtn: string;
  importPlayNowBtn: string;
  importQuickSamples: string;
  importSampleBtn: string;
  importRecentlyImported: (n: number) => string;
  importSpotifyUrlLabel: string;
  importLoadSamplePlaylist: string;
  importReadingUrl: string;
  importReadUrl: string;
  importSpotifyUrlError: string;
  importSpotifyParseError: string;
  importSpotifyFallbackNotice: string;
  importPlaylistNameLabel: string;
  importPlaylistNamePlaceholder: string;
  importTracklistLabel: string;
  importPlaylistEmptyError: string;
  importPlaylistMatchError: string;
  importMatchingProgress: (done: number, total: number) => string;
  importPlaylistButton: string;

  // PWA Install
  pwaInstallApp: string;
  pwaInstallIos: string;
  pwaInstallAria: string;
  pwaGuideTitle: string;
  pwaGuideSubtitle: string;
  pwaGuideCloseAria: string;
  pwaAndroidTitle: string;
  pwaAndroidBodyPre: string;
  pwaAndroidOption1: string;
  pwaAndroidBodyMid: string;
  pwaAndroidOption2: string;
  pwaIosTitle: string;
  pwaIosBodyPre: string;
  pwaIosShare: string;
  pwaIosBodyMid: string;
  pwaIosAddHome: string;
  pwaGotIt: string;

  // YouTube Player Bridge
  ytStreamLabel: string;
  ytHideLabel: string;
  ytHideAria: string;

  // Toast Notices
  noticeSignedInAs: (name: string) => string;
  noticeSignedOut: string;
  noticeSettingsSaved: string;
  noticeThemeReset: string;
  noticeCacheCleared: string;
  noticeImportedPlaying: (title: string) => string;
  noticeImportedPlaylist: (name: string, count: number) => string;
  noticeLayoutSaved: string;
  noticePlaylistCreated: (name: string) => string;
  noticePlaylistDeleted: string;
  noticeAddedToPlaylist: (track: string, pl: string) => string;
  noticeAddedToQueue: (track: string) => string;
  noticeLyricsSaved: string;
  noticeInvalidAudioFiles: string;
  noticeUploadedSingle: (title: string) => string;
  noticeUploadedMultiple: (count: number) => string;
  noticeRemovedLocal: string;
  noticeReuploadLocal: string;
  noticeSleepOff: string;
  noticeSleepSet: (minutes: number) => string;
  noticeSleepEnded: string;
  noticeLanguageChanged: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  tr: {
    appName: 'Cadence',
    cancel: 'İptal',
    save: 'Kaydet',
    close: 'Kapat',
    delete: 'Sil',
    reset: 'Sıfırla',
    retry: 'Tekrar Dene',
    done: 'Tamam',
    loading: 'Yükleniyor...',
    active: 'Aktif',
    off: 'Kapalı',
    songSingular: 'şarkı',
    songPlural: 'şarkı',
    songsCount: (n) => `${n} şarkı`,
    searchesCount: (n) => `${n} arama`,
    tracksDetected: (n) => `${n} parça algılandı`,

    greetingMorning: 'Günaydın',
    greetingAfternoon: 'İyi Günler',
    greetingEvening: 'İyi Akşamlar',

    authWelcomeTitle: "Cadence'a Hoş Geldiniz",
    authWelcomeSubtitle: 'Müzik kütüphanenize, çalma listelerinize ve senkronize şarkı sözlerine erişmek için giriş yapın.',
    authTabSignIn: 'Giriş Yap',
    authTabSignUp: 'Kayıt Ol',
    authDisplayNameLabel: 'Ad Soyad (İsteğe Bağlı)',
    authDisplayNamePlaceholder: 'Adınız',
    authEmailLabel: 'E-posta Adresi',
    authEmailPlaceholder: 'ornek@eposta.com',
    authPasswordLabel: 'Şifre',
    authPasswordPlaceholder: 'En az 6 karakter',
    authShowPassword: 'Şifreyi göster',
    authHidePassword: 'Şifreyi gizle',
    authSubmitSignIn: 'E-posta ile Giriş Yap',
    authSubmitSignUp: 'Hesap Oluştur',
    authSubmitting: 'İşleniyor...',
    authDividerOr: 'veya',
    authGoogleButton: 'Google ile Giriş Yap',
    authGoogleSigningIn: 'Giriş yapılıyor...',
    authGateNotice: 'Devam etmek için oturum açmalısınız.',
    authValidationEmptyEmail: 'Lütfen e-posta adresinizi girin.',
    authValidationInvalidEmail: 'Geçerli bir e-posta adresi girin.',
    authValidationEmptyPassword: 'Lütfen şifrenizi girin.',
    authValidationWeakPassword: 'Şifre çok zayıf. En az 6 karakter olmalıdır.',
    authSignUpVerifyHint: 'Hesap oluşturuldu! Bulut eşitleme için e-postanıza gönderilen doğrulama bağlantısını onaylayın.',

    navPrimaryAria: 'Ana gezinme',
    navMobileAria: 'Mobil gezinme',
    navHome: 'Ana Sayfa',
    navSearch: 'Ara',
    navLibrary: 'Kitaplık',
    navImportShort: 'Aktar',
    navThemeShort: 'Tema',
    actionLinkImport: 'Bağlantı & Aktar',
    actionUploadAudio: 'Ses Dosyası Yükle',
    actionNewPlaylist: 'Yeni Çalma Listesi',
    actionCustomizeTheme: 'Temayı Özelleştir',
    sidebarPlaylists: 'Çalma Listeleri',
    sidebarCloudSynced: 'Bulut Senkronize',
    sidebarVerifyPending: 'Doğrulama Bekleniyor',
    sidebarSignOutAria: 'Hesaptan çıkış yap',
    sidebarSignOutTitle: 'Çıkış Yap',
    sidebarSignInGoogle: 'Google ile Giriş Yap',
    sidebarSigningIn: 'Giriş yapılıyor...',
    sidebarSettings: 'Ayarlar',
    mobileCloudSyncAria: 'Bulut Eşitleme Hesabı',
    mobileUploadAria: 'Ses dosyası yükle',
    mobileThemeAria: 'Temayı Özelleştir',
    mobileSettingsAria: 'Ayarlar',

    homeCustomizeButton: 'Ana Ekranı Düzenle',
    homeSaveLayout: 'Düzeni Kaydet',
    homeEditInstructionsPre: 'Bölümleri açıp kapatın, oklarla veya sürükleyerek sıralayın ve ardından ',
    homeEditInstructionsEnd: ' düğmesine tıklayın.',
    homeHiddenTitle: 'Ana ekranınız gizlendi',
    homeHiddenBody:
      'Tüm Ana Ekran bileşenleri şu anda kapalı. Hızlı Seçimler, Son Çalınanlar veya Çalma Listelerini açmak için Ana Ekranı Düzenle bölümüne gidin.',
    homeRecentEmpty: 'Hızlı Seçimler, Ara veya Kitaplık üzerinden çaldığınız parçalar burada görünür.',
    homeCreatePlaylist: 'Çalma Listesi Oluştur',
    homeVisible: 'Görünür',
    homeHidden: 'Gizli',
    homeShown: 'Açık',
    homeMoveUpAria: (label) => `${label} bölümünü yukarı taşı`,
    homeMoveDownAria: (label) => `${label} bölümünü aşağı taşı`,
    homeHideWidgetAria: (label) => `${label} bölümünü gizle`,
    homeShowWidgetAria: (label) => `${label} bölümünü göster`,
    widgetQuickPicks: 'Hızlı Seçimler',
    widgetQuickPicksDesc: 'Özenle seçilmiş atmosferik ve tam uzunlukta dinleme oturumları.',
    widgetRecentlyPlayed: 'Son Çalınanlar',
    widgetRecentlyPlayedDesc: 'Son dinlediğiniz parçalara ve mikslere hızla dönün.',
    widgetPlaylists: 'Çalma Listeleri',
    widgetPlaylistsDesc: 'Kişisel miksleriniz ve kayıtlı koleksiyonlarınız.',

    playAria: (title) => `${title} parçasını çal`,
    pauseAria: (title) => `${title} parçasını duraklat`,
    favAddAria: (title) => `${title} parçasını favorilere ekle`,
    favRemoveAria: (title) => `${title} parçasını favorilerden çıkar`,
    moreOptionsAria: (title) => `${title} için diğer seçenekler`,
    menuAddToUpNext: 'Sıradakilere Ekle',
    menuViewLyrics: 'Şarkı Sözlerini Gör',
    menuAddToPlaylist: 'Çalma Listesine Ekle',
    menuNewPlaylist: 'Yeni Çalma Listesi',

    searchTitle: 'Ara',
    searchPlaceholder: 'Sanatçı, şarkı veya albüm ara...',
    searchInputAria: 'Şarkı, sanatçı veya albüm ara',
    searchClearAria: 'Aramayı temizle',
    searchButton: 'Ara',
    searchTrending: 'Popüler:',
    searchDiscoverTitle: 'Müziği Keşfet',
    searchDiscoverBody: 'Anında tam uzunlukta çalmak için dilediğiniz sanatçıyı, şarkıyı veya albümü arayın.',
    searchBusyAria: 'Parçalar aranıyor',
    searchError: 'Şu anda arama tamamlanamıyor. Bağlantınızı kontrol edip tekrar deneyin.',
    searchInLibrary: 'Kitaplığınızda',
    searchTopResults: (q) => `"${q}" için En İyi Sonuçlar`,
    searchNoMatches: (q) => `"${q}" ile eşleşen şarkı bulunamadı. Başka bir sanatçı veya şarkı adı deneyin.`,

    libraryTitle: 'Kitaplık',
    libraryBack: 'Kitaplığa Dön',
    libraryPlaylistLabel: 'Çalma Listesi',
    libraryTotal: 'toplam',
    libraryPlayAll: 'Tümünü Çal',
    libraryDeletePlaylist: 'Listeyi Sil',
    libraryDeletePlaylistAria: (name) => `${name} çalma listesini sil`,
    libraryEmptyPlaylist:
      'Bu çalma listesinde henüz parça yok. Parça eklemek için Ana Sayfa veya Ara ekranındaki menüyü kullanın.',
    libraryRemoveFromPlaylistAria: (track, pl) => `${track} parçasını ${pl} listesinden çıkar`,
    libraryTabPlaylists: (n) => `Çalma Listeleri (${n})`,
    libraryTabFavorites: (n) => `Favoriler (${n})`,
    libraryTabLocal: (n) => `Yerel Dosyalar (${n})`,
    libraryEmptyFavorites: 'Favorilere kaydetmek için herhangi bir parçadaki kalp simgesine dokunun.',
    libraryDropTitle: 'Yerel MP3, WAV veya OGG dosyalarını buraya bırakın',
    libraryDropSubtitle: 'Doğrudan tarayıcınızda çalar ve bu cihazda saklanır.',
    libraryChooseFiles: 'Ses Dosyası Seç',
    libraryRemoveLocalAria: (title) => `${title} parçasını Yerel Dosyalardan kaldır`,

    playerBarAria: 'Ses oynatıcı kontrolleri',
    playerEmptyState: 'Dinlemeye başlamak için bir parça seçin',
    playerOpenNowPlayingAria: (title) => `${title} için Şimdi Çalınıyor ekranını aç`,
    playerEnableShuffle: 'Karıştırmayı aç',
    playerDisableShuffle: 'Karıştırmayı kapat',
    playerPrevTrack: 'Önceki parça',
    playerNextTrack: 'Sonraki parça',
    playerPlay: 'Çal',
    playerPause: 'Duraklat',
    playerRepeatAria: (mode) => `Tekrar modu: ${mode}`,
    playerSeekAria: 'Parça konumunu sar',
    playerOpenLyricsAria: 'Şarkı Sözlerini Aç',
    playerOpenQueueAria: 'Sıradaki Kuyruğu Aç',
    playerLyricsTitle: 'Şarkı Sözleri',
    playerUpNextTitle: 'Sıradakiler',
    playerMuteAria: 'Sesi kapat',
    playerUnmuteAria: 'Sesi aç',
    playerVolumeAria: 'Ses seviyesi',
    playerExpandAria: 'Şimdi Çalınıyor ekranını genişlet',

    npDialogAria: 'Şimdi Çalınıyor',
    npSwipeHandleAria: 'Aşağı kaydırma tutamacı',
    npMinimize: 'Küçült',
    npMinimizeAria: 'Şimdi Çalınıyor ekranını küçült',
    npTabUpNext: 'Sıradakiler',
    npTabLyrics: 'Şarkı Sözleri',
    npSleepTimer: 'Uyku Zamanlayıcısı',
    npSleepShort: 'Uyku',
    npMinutes: (m) => `${m} dakika`,
    npSyncedSubtitle: 'Senkronize Sözler · Gitmek için satıra dokunun',
    npEditLyrics: 'Sözleri Düzenle',
    npAddLyrics: 'Söz Ekle',
    npLyricsEditorHint: 'Düz metin veya LRC zaman damgaları yapıştırın (örn. [00:12.00] Satır)',
    npLyricsPlaceholder: 'Şarkı sözlerini buraya yazın veya yapıştırın...',
    npSaveLyrics: 'Sözleri Kaydet',
    npFetchingLyrics: 'Senkronize şarkı sözleri getiriliyor...',
    npNoLyricsForTrack: (title) => `"${title}" için henüz şarkı sözü bulunamadı.`,
    npAddCustomLyrics: 'Özel Şarkı Sözü Ekle',
    npQueueEmpty: 'Sıranız şu anda boş.',
    npRemoveFromQueueAria: (title) => `${title} parçasını sıradan çıkar`,

    plModalTitle: 'Yeni Çalma Listesi',
    plModalCloseAria: 'Pencereyi kapat',
    plModalNameLabel: 'Çalma Listesi Adı',
    plModalNamePlaceholder: 'Gece Sentezi',
    plModalNameRequired: 'Lütfen bir çalma listesi adı girin.',
    plModalDescLabel: 'Açıklama',
    plModalDescPlaceholder: 'Ruh hali veya parçalar hakkında isteğe bağlı not',
    plModalDefaultDesc: 'Kişisel miks',
    plModalCreateButton: 'Çalma Listesi Oluştur',

    settingsTitle: 'Görünüm ve Ayarlar',
    settingsSubtitle: 'Cam temasını, dili, düzeni ve bulut eşitlemeyi kişiselleştirin',
    settingsCloseAria: 'Ayarları kapat',
    settingsTabTheme: 'Tema ve Düzen',
    settingsTabAccount: 'Hesap ve Oynatma',
    settingsLanguageLabel: 'Uygulama Dili / Language',
    settingsLanguageDesc: 'Arayüz dilini Türkçe veya İngilizce olarak seçin.',
    settingsAccentColor: 'Vurgu Rengi',
    settingsGlassIntensity: 'Cam Yoğunluğu',
    settingsGlassDesc: 'Arka plan bulanıklığını ve panel şeffaflığını ayarlar.',
    settingsAmbientGlow: 'Ortam Işığı',
    settingsAmbientDesc: 'Albüm kapağına göre değişen dinamik renk halesi.',
    settingsLayoutDensity: 'Düzen Sıklığı',
    settingsDensityComfortable: 'Rahat',
    settingsDensityCompact: 'Kompakt',
    settingsPlayerBarStyle: 'Oynatıcı Çubuğu Stili',
    settingsPlayerDocked: 'Sabit Çubuk',
    settingsPlayerFloating: 'Yüzen Cam Hap',
    settingsResetTheme: 'Varsayılanlara Sıfırla',
    settingsCloudAccountActive: 'Bulut Eşitleme Aktif',
    settingsCloudGuest: 'Çevrimdışı Mod',
    settingsCloudSyncedDesc: 'Çalma listeleri, favoriler, tema ve ana ekran cihazlar arasında eşitlenir',
    settingsCloudUnverifiedDesc:
      'Bulut eşitlemeyi etkinleştirmek için e-postanıza gelen doğrulama bağlantısını onaylayın.',
    settingsCloudSignInPrompt: 'Kütüphanenizi PC ve Android arasında eşitlemek için giriş yapın',
    settingsResendVerification: 'Doğrulamayı Tekrar Gönder',
    settingsRefreshVerification: 'Durumu Yenile',
    settingsVerificationSent: 'Doğrulama e-postası gönderildi. Gelen kutunuzu kontrol edin.',
    settingsSignOut: 'Çıkış Yap',
    settingsCompactVideoTitle: 'Köşede Mini Video Oynatıcı',
    settingsCompactVideoDesc:
      'Sadece ses için videoyu gizli tutun veya oynatıcı çubuğu üzerinde küçük bir video penceresi gösterin.',
    settingsCompactVideoVisible: 'Görünür',
    settingsCompactVideoHidden: 'Gizli Ses',
    settingsCacheTitle: 'Çevrimdışı Arama Önbelleği',
    settingsCacheDesc: 'Daha önce aranan şarkılar ve listeler için anında sonuçlar.',
    settingsClearCache: 'Önbelleği Temizle',
    settingsAdvanced: 'Gelişmiş',
    settingsAdvancedCustomKey: 'Özel Anahtar Aktif',
    settingsAdvancedSecrets: 'Secrets ile Bağlı',
    settingsAdvancedDefault: 'Varsayılan Eşleştirici',
    settingsCustomYtKeyLabel: 'Özel YouTube API Anahtarı (İsteğe Bağlı)',
    settingsCustomYtKeyPlaceholderSecrets: 'Secrets ile bağlı (değiştirmek için yapıştırın)...',
    settingsCustomYtKeyPlaceholderDefault: 'İsteğe bağlı özel YouTube Data API v3 anahtarı',
    settingsClearApiKeyAria: 'API anahtarını temizle',
    settingsShowApiKeyAria: 'API anahtarını göster',
    settingsHideApiKeyAria: 'API anahtarını gizle',
    settingsSaveButton: 'Ayarları Kaydet',

    importModalTitle: 'Bağlantı ve Liste Aktarıcı',
    importModalSubtitle: 'Herhangi bir şarkı bağlantısını veya çalma listesini kitaplığınıza aktarın',
    importModalCloseAria: 'Bağlantı ve Aktar penceresini kapat',
    importTabSingle: 'Tek Şarkı Bağlantısı',
    importTabPlaylist: 'Çalma Listesi Aktar',
    importSingleUrlLabel: 'Parça Bağlantısı (YouTube, YouTube Music veya Spotify)',
    importSingleUrlErrorEmpty: 'Bir YouTube, YouTube Music veya Spotify parça bağlantısı yapıştırın.',
    importSingleUrlErrorInvalid:
      'Bu bağlantı çözümlenemedi. Geçerli bir YouTube, YouTube Music veya Spotify bağlantısı yapıştırın.',
    importMatching: 'Eşleştiriliyor...',
    importAndPlayBtn: 'Aktar ve Çal',
    importPlayNowBtn: 'Şimdi Çal',
    importQuickSamples: 'Hızlı örnek parçalar:',
    importSampleBtn: 'Aktar',
    importRecentlyImported: (n) => `Son Aktarılanlar (${n})`,
    importSpotifyUrlLabel: 'Spotify Çalma Listesi Bağlantısı',
    importLoadSamplePlaylist: 'Örnek Liste Yükle',
    importReadingUrl: 'Okunuyor...',
    importReadUrl: 'Bağlantıyı Oku',
    importSpotifyUrlError: 'Bir Spotify çalma listesi bağlantısı yapıştırın (örn. https://open.spotify.com/playlist/...)',
    importSpotifyParseError:
      'Spotify çalma listesi okunamadı. Aşağıya "Sanatçı - Şarkı Adı" listesi yapıştırın.',
    importSpotifyFallbackNotice:
      'Liste adı ve kapağı açık oEmbed üzerinden yüklendi. Spotify tarayıcıdan parça listesi çekmeyi kısıtladığı için aşağıya örnek bir liste eklendi; aktarmadan önce dilediğiniz gibi düzenleyebilirsiniz.',
    importPlaylistNameLabel: 'Çalma Listesi Adı',
    importPlaylistNamePlaceholder: 'Aktarılan Miks',
    importTracklistLabel: 'Parça Listesi ("Sanatçı - Şarkı Adı" veya CSV)',
    importPlaylistEmptyError:
      'Lütfen bir Spotify çalma listesi bağlantısı yapıştırın veya en az bir "Sanatçı - Şarkı Adı" satırı girin.',
    importPlaylistMatchError: 'Parçalar eşleştirilemedi. Lütfen tekrar deneyin.',
    importMatchingProgress: (done, total) => `Eşleştiriliyor ${done}/${total}`,
    importPlaylistButton: 'Listeyi Aktar',

    pwaInstallApp: 'Uygulamayı Yükle',
    pwaInstallIos: "iOS'a Yükle",
    pwaInstallAria: 'Cadence Uygulamasını Yükle',
    pwaGuideTitle: "Cadence'ı Yükle",
    pwaGuideSubtitle: 'Ana Ekranınıza ekleyin',
    pwaGuideCloseAria: 'Kurulum rehberini kapat',
    pwaAndroidTitle: 'Android (Chrome)',
    pwaAndroidBodyPre: 'Tarayıcı menüsüne ',
    pwaAndroidOption1: 'Uygulamayı yükle',
    pwaAndroidBodyMid: ' veya ',
    pwaAndroidOption2: 'Ana ekrana ekle',
    pwaIosTitle: 'iOS / iPadOS (Safari)',
    pwaIosBodyPre: 'Araç çubuğundaki ',
    pwaIosShare: 'Paylaş',
    pwaIosBodyMid: ' düğmesine dokunun ve ',
    pwaIosAddHome: 'Ana Ekrana Ekle',
    pwaGotIt: 'Anladım',

    ytStreamLabel: 'YouTube Yayını',
    ytHideLabel: 'Gizle',
    ytHideAria: 'Mini video oynatıcıyı gizle',

    noticeSignedInAs: (name) => `${name} olarak giriş yapıldı.`,
    noticeSignedOut: 'Çıkış yapıldı.',
    noticeSettingsSaved: 'Ayarlar kaydedildi.',
    noticeThemeReset: 'Tema varsayılanlara sıfırlandı.',
    noticeCacheCleared: 'Arama önbelleği temizlendi.',
    noticeImportedPlaying: (title) => `"${title}" aktarıldı ve çalınıyor.`,
    noticeImportedPlaylist: (name, count) => `"${name}" (${count} parça) aktarıldı.`,
    noticeLayoutSaved: 'Ana ekran düzeni kaydedildi.',
    noticePlaylistCreated: (name) => `"${name}" oluşturuldu.`,
    noticePlaylistDeleted: 'Çalma listesi silindi.',
    noticeAddedToPlaylist: (track, pl) => `"${track}" → ${pl} listesine eklendi.`,
    noticeAddedToQueue: (track) => `"${track}" sıradakilere eklendi.`,
    noticeLyricsSaved: 'Şarkı sözleri kaydedildi.',
    noticeInvalidAudioFiles: 'Lütfen geçerli ses dosyaları seçin (MP3, WAV veya OGG).',
    noticeUploadedSingle: (title) => `"${title}" yüklendi.`,
    noticeUploadedMultiple: (count) => `${count} yerel ses dosyası yüklendi.`,
    noticeRemovedLocal: 'Yerel dosya kaldırıldı.',
    noticeReuploadLocal: 'Bu yerel dosyayı çalmak için lütfen yeniden yükleyin.',
    noticeSleepOff: 'Uyku zamanlayıcısı kapatıldı.',
    noticeSleepSet: (minutes) => `Uyku zamanlayıcısı ${minutes} dakikaya ayarlandı.`,
    noticeSleepEnded: 'Uyku zamanlayıcısı doldu · Oynatma duraklatıldı.',
    noticeLanguageChanged: 'Dil Türkçe olarak ayarlandı.',
  },
  en: {
    appName: 'Cadence',
    cancel: 'Cancel',
    save: 'Save',
    close: 'Close',
    delete: 'Delete',
    reset: 'Reset',
    retry: 'Retry',
    done: 'Done',
    loading: 'Loading...',
    active: 'Active',
    off: 'Off',
    songSingular: 'song',
    songPlural: 'songs',
    songsCount: (n) => `${n} ${n === 1 ? 'song' : 'songs'}`,
    searchesCount: (n) => `${n} ${n === 1 ? 'search' : 'searches'} saved`,
    tracksDetected: (n) => `${n} ${n === 1 ? 'track' : 'tracks'} detected`,

    greetingMorning: 'Good Morning',
    greetingAfternoon: 'Good Afternoon',
    greetingEvening: 'Good Evening',

    authWelcomeTitle: 'Welcome to Cadence',
    authWelcomeSubtitle: 'Sign in to access your music library, playlists, and synced lyrics.',
    authTabSignIn: 'Sign In',
    authTabSignUp: 'Sign Up',
    authDisplayNameLabel: 'Display Name (Optional)',
    authDisplayNamePlaceholder: 'Your name',
    authEmailLabel: 'Email Address',
    authEmailPlaceholder: 'you@example.com',
    authPasswordLabel: 'Password',
    authPasswordPlaceholder: 'At least 6 characters',
    authShowPassword: 'Show password',
    authHidePassword: 'Hide password',
    authSubmitSignIn: 'Sign in with Email',
    authSubmitSignUp: 'Create Account',
    authSubmitting: 'Working...',
    authDividerOr: 'or',
    authGoogleButton: 'Sign in with Google',
    authGoogleSigningIn: 'Signing in...',
    authGateNotice: 'Please sign in to continue.',
    authValidationEmptyEmail: 'Please enter your email address.',
    authValidationInvalidEmail: 'Please enter a valid email address.',
    authValidationEmptyPassword: 'Please enter your password.',
    authValidationWeakPassword: 'Password is too weak. Use at least 6 characters.',
    authSignUpVerifyHint: 'Account created! Check your email for the verification link to enable Cloud Sync.',

    navPrimaryAria: 'Primary navigation',
    navMobileAria: 'Mobile navigation',
    navHome: 'Home',
    navSearch: 'Search',
    navLibrary: 'Library',
    navImportShort: 'Import',
    navThemeShort: 'Theme',
    actionLinkImport: 'Link & Import',
    actionUploadAudio: 'Upload Audio',
    actionNewPlaylist: 'New Playlist',
    actionCustomizeTheme: 'Customize Theme',
    sidebarPlaylists: 'Playlists',
    sidebarCloudSynced: 'Cloud Synced',
    sidebarVerifyPending: 'Verification Pending',
    sidebarSignOutAria: 'Sign out',
    sidebarSignOutTitle: 'Sign Out',
    sidebarSignInGoogle: 'Sign in with Google',
    sidebarSigningIn: 'Signing in...',
    sidebarSettings: 'Settings',
    mobileCloudSyncAria: 'Cloud Sync Account',
    mobileUploadAria: 'Upload audio',
    mobileThemeAria: 'Customize Theme',
    mobileSettingsAria: 'Settings',

    homeCustomizeButton: 'Customize Home',
    homeSaveLayout: 'Save Layout',
    homeEditInstructionsPre: 'Toggle sections on or off, reorder them with the arrows or by dragging, then select ',
    homeEditInstructionsEnd: '.',
    homeHiddenTitle: 'Your Home screen is hidden',
    homeHiddenBody:
      'All Home widgets are currently turned off. Open Customize Home to enable Quick Picks, Recently Played, or Playlists.',
    homeRecentEmpty: 'Tracks you play from Quick Picks, Search, or Library will appear here.',
    homeCreatePlaylist: 'Create Playlist',
    homeVisible: 'Visible',
    homeHidden: 'Hidden',
    homeShown: 'Shown',
    homeMoveUpAria: (label) => `Move ${label} up`,
    homeMoveDownAria: (label) => `Move ${label} down`,
    homeHideWidgetAria: (label) => `Hide ${label}`,
    homeShowWidgetAria: (label) => `Show ${label}`,
    widgetQuickPicks: 'Quick Picks',
    widgetQuickPicksDesc: 'Curated ambient, electronic, and full-length listening sessions.',
    widgetRecentlyPlayed: 'Recently Played',
    widgetRecentlyPlayedDesc: 'Jump back into tracks and mixes you listened to recently.',
    widgetPlaylists: 'Playlists',
    widgetPlaylistsDesc: 'Your personal mixes and saved collections.',

    playAria: (title) => `Play ${title}`,
    pauseAria: (title) => `Pause ${title}`,
    favAddAria: (title) => `Favorite ${title}`,
    favRemoveAria: (title) => `Remove ${title} from favorites`,
    moreOptionsAria: (title) => `More options for ${title}`,
    menuAddToUpNext: 'Add to Up Next',
    menuViewLyrics: 'View Lyrics',
    menuAddToPlaylist: 'Add to Playlist',
    menuNewPlaylist: 'New Playlist',

    searchTitle: 'Search',
    searchPlaceholder: 'Artists, songs, or albums...',
    searchInputAria: 'Search songs, artists, or albums',
    searchClearAria: 'Clear search',
    searchButton: 'Search',
    searchTrending: 'Trending:',
    searchDiscoverTitle: 'Discover Music',
    searchDiscoverBody: 'Search any artist, song, or album for instant full-length playback.',
    searchBusyAria: 'Searching tracks',
    searchError: 'Unable to complete search right now. Check your connection and try again.',
    searchInLibrary: 'In Your Library',
    searchTopResults: (q) => `Top Results for "${q}"`,
    searchNoMatches: (q) => `No songs matched "${q}". Try another artist or song title.`,

    libraryTitle: 'Library',
    libraryBack: 'Back to Library',
    libraryPlaylistLabel: 'Playlist',
    libraryTotal: 'total',
    libraryPlayAll: 'Play All',
    libraryDeletePlaylist: 'Delete Playlist',
    libraryDeletePlaylistAria: (name) => `Delete playlist ${name}`,
    libraryEmptyPlaylist:
      'This playlist has no tracks yet. Use the menu on any song in Home or Search to add tracks here.',
    libraryRemoveFromPlaylistAria: (track, pl) => `Remove ${track} from ${pl}`,
    libraryTabPlaylists: (n) => `Playlists (${n})`,
    libraryTabFavorites: (n) => `Favorites (${n})`,
    libraryTabLocal: (n) => `Local Files (${n})`,
    libraryEmptyFavorites: 'Tap the heart icon on any track to save it to Favorites.',
    libraryDropTitle: 'Drop local MP3, WAV, or OGG files here',
    libraryDropSubtitle: 'Plays directly in your browser and saves on this device.',
    libraryChooseFiles: 'Choose Audio Files',
    libraryRemoveLocalAria: (title) => `Remove ${title} from Local Files`,

    playerBarAria: 'Audio player controls',
    playerEmptyState: 'Select a track to start listening',
    playerOpenNowPlayingAria: (title) => `Open Now Playing for ${title}`,
    playerEnableShuffle: 'Enable shuffle',
    playerDisableShuffle: 'Disable shuffle',
    playerPrevTrack: 'Previous track',
    playerNextTrack: 'Next track',
    playerPlay: 'Play',
    playerPause: 'Pause',
    playerRepeatAria: (mode) => `Repeat mode: ${mode}`,
    playerSeekAria: 'Seek audio position',
    playerOpenLyricsAria: 'Open Lyrics view',
    playerOpenQueueAria: 'Open Up Next queue',
    playerLyricsTitle: 'Lyrics',
    playerUpNextTitle: 'Up Next',
    playerMuteAria: 'Mute volume',
    playerUnmuteAria: 'Unmute volume',
    playerVolumeAria: 'Volume',
    playerExpandAria: 'Expand Now Playing',

    npDialogAria: 'Now Playing',
    npSwipeHandleAria: 'Swipe down handle',
    npMinimize: 'Minimize',
    npMinimizeAria: 'Minimize Now Playing',
    npTabUpNext: 'Up Next',
    npTabLyrics: 'Lyrics',
    npSleepTimer: 'Sleep Timer',
    npSleepShort: 'Sleep',
    npMinutes: (m) => `${m} minutes`,
    npSyncedSubtitle: 'Synced Lyrics · Tap any line to jump',
    npEditLyrics: 'Edit Lyrics',
    npAddLyrics: 'Add Lyrics',
    npLyricsEditorHint: 'Paste plain text or LRC timestamps (e.g. [00:12.00] Line)',
    npLyricsPlaceholder: 'Write or paste lyrics here...',
    npSaveLyrics: 'Save Lyrics',
    npFetchingLyrics: 'Fetching synced lyrics...',
    npNoLyricsForTrack: (title) => `No lyrics available for "${title}" yet.`,
    npAddCustomLyrics: 'Add Custom Lyrics',
    npQueueEmpty: 'Your queue is empty.',
    npRemoveFromQueueAria: (title) => `Remove ${title} from queue`,

    plModalTitle: 'New Playlist',
    plModalCloseAria: 'Close modal',
    plModalNameLabel: 'Playlist Name',
    plModalNamePlaceholder: 'Late Night Synth',
    plModalNameRequired: 'Please enter a playlist name.',
    plModalDescLabel: 'Description',
    plModalDescPlaceholder: 'Optional note about the mood or tracks',
    plModalDefaultDesc: 'Personal mix',
    plModalCreateButton: 'Create Playlist',

    settingsTitle: 'Appearance & Settings',
    settingsSubtitle: 'Personalize your glass theme, language, layout, and cloud sync',
    settingsCloseAria: 'Close settings',
    settingsTabTheme: 'Theme & Layout',
    settingsTabAccount: 'Account & Playback',
    settingsLanguageLabel: 'Language / Dil',
    settingsLanguageDesc: 'Choose Turkish or English interface language.',
    settingsAccentColor: 'Accent Color',
    settingsGlassIntensity: 'Glass Intensity',
    settingsGlassDesc: 'Controls backdrop blur depth & panel translucency.',
    settingsAmbientGlow: 'Ambient Glow',
    settingsAmbientDesc: 'Dynamic album artwork color aura behind surfaces.',
    settingsLayoutDensity: 'Layout Density',
    settingsDensityComfortable: 'Comfortable',
    settingsDensityCompact: 'Compact',
    settingsPlayerBarStyle: 'Player Bar Style',
    settingsPlayerDocked: 'Docked Bar',
    settingsPlayerFloating: 'Floating Glass Pill',
    settingsResetTheme: 'Reset to Defaults',
    settingsCloudAccountActive: 'Cloud Sync Active',
    settingsCloudGuest: 'Offline Mode',
    settingsCloudSyncedDesc: 'Playlists, favorites, theme & home layout synced across devices',
    settingsCloudUnverifiedDesc:
      'Verify the confirmation link sent to your email to activate Cloud Sync.',
    settingsCloudSignInPrompt: 'Sign in to sync your library across PC and Android',
    settingsResendVerification: 'Resend Verification',
    settingsRefreshVerification: 'Refresh Status',
    settingsVerificationSent: 'Verification email sent. Check your inbox.',
    settingsSignOut: 'Sign Out',
    settingsCompactVideoTitle: 'Compact Corner Video Player',
    settingsCompactVideoDesc:
      'Keep the video player hidden for pure audio, or show a compact mini-video above the player bar.',
    settingsCompactVideoVisible: 'Visible',
    settingsCompactVideoHidden: 'Hidden Audio',
    settingsCacheTitle: 'Offline Search Cache',
    settingsCacheDesc: 'Instant results for previously searched songs and playlists.',
    settingsClearCache: 'Clear Cache',
    settingsAdvanced: 'Advanced',
    settingsAdvancedCustomKey: 'Custom Key Active',
    settingsAdvancedSecrets: 'Connected via Secrets',
    settingsAdvancedDefault: 'Default Matcher',
    settingsCustomYtKeyLabel: 'Custom YouTube API Key (Optional Override)',
    settingsCustomYtKeyPlaceholderSecrets: 'Connected via Secrets (paste to override)...',
    settingsCustomYtKeyPlaceholderDefault: 'Optional custom YouTube Data API v3 key',
    settingsClearApiKeyAria: 'Clear API key',
    settingsShowApiKeyAria: 'Show API key',
    settingsHideApiKeyAria: 'Hide API key',
    settingsSaveButton: 'Save Settings',

    importModalTitle: 'Link & Playlist Importer',
    importModalSubtitle: 'Import any track link or playlist directly into your library',
    importModalCloseAria: 'Close Link & Import modal',
    importTabSingle: 'Single Track Link',
    importTabPlaylist: 'Playlist Import',
    importSingleUrlLabel: 'Track URL (YouTube, YouTube Music, or Spotify)',
    importSingleUrlErrorEmpty: 'Paste a YouTube, YouTube Music, or Spotify track URL.',
    importSingleUrlErrorInvalid:
      'Could not resolve this URL. Please paste a valid YouTube, YouTube Music, or Spotify link.',
    importMatching: 'Matching...',
    importAndPlayBtn: 'Import & Play',
    importPlayNowBtn: 'Play Now',
    importQuickSamples: 'Quick sample tracks:',
    importSampleBtn: 'Import',
    importRecentlyImported: (n) => `Recently Imported (${n})`,
    importSpotifyUrlLabel: 'Spotify Playlist URL',
    importLoadSamplePlaylist: 'Load Sample Playlist',
    importReadingUrl: 'Reading...',
    importReadUrl: 'Read URL',
    importSpotifyUrlError: 'Paste a Spotify playlist URL (e.g. https://open.spotify.com/playlist/...)',
    importSpotifyParseError:
      'Unable to read Spotify playlist URL. Paste an "Artist - Song Title" list below instead.',
    importSpotifyFallbackNotice:
      'Loaded playlist title & artwork via public oEmbed. Spotify restricts cross-origin tracklist scraping in the browser, so we pre-filled a starter tracklist below—edit or paste any "Artist - Song Title" lines before importing.',
    importPlaylistNameLabel: 'Playlist Name',
    importPlaylistNamePlaceholder: 'My Imported Mix',
    importTracklistLabel: 'Tracklist ("Artist - Song Title" or CSV)',
    importPlaylistEmptyError:
      'Please paste a Spotify playlist URL or enter at least one "Artist - Song Title" line.',
    importPlaylistMatchError: 'Failed to match tracks. Please try again.',
    importMatchingProgress: (done, total) => `Matching ${done}/${total}`,
    importPlaylistButton: 'Import Playlist',

    pwaInstallApp: 'Install App',
    pwaInstallIos: 'Install on iOS',
    pwaInstallAria: 'Install Cadence App',
    pwaGuideTitle: 'Install Cadence',
    pwaGuideSubtitle: 'Add to your Home Screen',
    pwaGuideCloseAria: 'Close install guide',
    pwaAndroidTitle: 'Android (Chrome)',
    pwaAndroidBodyPre: 'Tap the browser menu ',
    pwaAndroidOption1: 'Install app',
    pwaAndroidBodyMid: ' or ',
    pwaAndroidOption2: 'Add to Home screen',
    pwaIosTitle: 'iOS / iPadOS (Safari)',
    pwaIosBodyPre: 'Tap the ',
    pwaIosShare: 'Share',
    pwaIosBodyMid: ' button in the toolbar and choose ',
    pwaIosAddHome: 'Add to Home Screen',
    pwaGotIt: 'Got it',

    ytStreamLabel: 'YouTube Stream',
    ytHideLabel: 'Hide',
    ytHideAria: 'Hide compact video player',

    noticeSignedInAs: (name) => `Signed in as ${name}.`,
    noticeSignedOut: 'Signed out.',
    noticeSettingsSaved: 'Settings saved.',
    noticeThemeReset: 'Theme reset to defaults.',
    noticeCacheCleared: 'Cleared search cache.',
    noticeImportedPlaying: (title) => `Imported & playing "${title}".`,
    noticeImportedPlaylist: (name, count) => `Imported "${name}" (${count} tracks).`,
    noticeLayoutSaved: 'Home layout saved.',
    noticePlaylistCreated: (name) => `Created "${name}".`,
    noticePlaylistDeleted: 'Playlist deleted.',
    noticeAddedToPlaylist: (track, pl) => `Added "${track}" to ${pl}.`,
    noticeAddedToQueue: (track) => `Added "${track}" to Up Next.`,
    noticeLyricsSaved: 'Lyrics saved.',
    noticeInvalidAudioFiles: 'Please select valid audio files (MP3, WAV, or OGG).',
    noticeUploadedSingle: (title) => `Uploaded "${title}".`,
    noticeUploadedMultiple: (count) => `Uploaded ${count} local audio files.`,
    noticeRemovedLocal: 'Removed local file.',
    noticeReuploadLocal: 'Please re-upload this local file to play it.',
    noticeSleepOff: 'Sleep timer turned off.',
    noticeSleepSet: (minutes) => `Sleep timer set for ${minutes} minutes.`,
    noticeSleepEnded: 'Sleep timer ended · Playback paused.',
    noticeLanguageChanged: 'Language switched to English.',
  },
};

export function getTranslations(lang: AppLanguage): TranslationDictionary {
  return TRANSLATIONS[lang] || TRANSLATIONS.tr;
}

export function getLocalizedGreeting(hour: number, lang: AppLanguage): string {
  const t = getTranslations(lang);
  if (hour >= 5 && hour < 12) return t.greetingMorning;
  if (hour >= 12 && hour < 17) return t.greetingAfternoon;
  return t.greetingEvening;
}

export function getLocalizedWidgetLabel(id: HomeWidgetId, lang: AppLanguage): string {
  const t = getTranslations(lang);
  if (id === 'quick-picks') return t.widgetQuickPicks;
  if (id === 'recently-played') return t.widgetRecentlyPlayed;
  return t.widgetPlaylists;
}

export function getLocalizedWidgetDescription(id: HomeWidgetId, lang: AppLanguage): string {
  const t = getTranslations(lang);
  if (id === 'quick-picks') return t.widgetQuickPicksDesc;
  if (id === 'recently-played') return t.widgetRecentlyPlayedDesc;
  return t.widgetPlaylistsDesc;
}
