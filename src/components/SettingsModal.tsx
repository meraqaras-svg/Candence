import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Cloud,
  Database,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  LayoutGrid,
  LogIn,
  LogOut,
  MailCheck,
  Palette,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Trash2,
  Tv,
  X,
} from 'lucide-react';
import type {
  AccentColorPreset,
  AppLanguage,
  AppSettings,
  CloudUserProfile,
  LayoutDensity,
  PlayerBarStyle,
  ThemePrefs,
} from '../types/music';
import { getLocalizedAccentOptions } from '../utils/ambientColor';
import { useI18n } from '../utils/I18nContext';
import { DEFAULT_THEME_PREFS } from '../utils/storage';
import { getEffectiveYouTubeApiKey, getEnvYouTubeApiKey } from '../utils/youtubeAndOembed';
import { AnimatedTabIndicator, NYXON_SPRING } from './MotionPrimitives';

export type SettingsModalTab = 'theme' | 'api';

interface SettingsModalProps {
  open: boolean;
  initialTab?: SettingsModalTab;
  settings: AppSettings;
  themePrefs: ThemePrefs;
  cachedQueryCount: number;
  cloudUser?: CloudUserProfile | null;
  isSigningIn?: boolean;
  onSignInGoogle?: () => void;
  onSignOutCloud?: () => void;
  onResendVerification?: () => Promise<void>;
  onRefreshVerification?: () => Promise<void>;
  onLanguageChanged?: (lang: AppLanguage) => void;
  onClose: () => void;
  onSaveSettings: (next: AppSettings) => void;
  onUpdateThemePrefs: (next: ThemePrefs) => void;
  onResetThemePrefs: () => void;
  onClearSearchCache: () => void;
}

export function SettingsModal({
  open,
  initialTab = 'theme',
  settings,
  themePrefs,
  cachedQueryCount,
  cloudUser = null,
  isSigningIn = false,
  onSignInGoogle,
  onSignOutCloud,
  onResendVerification,
  onRefreshVerification,
  onLanguageChanged,
  onClose,
  onSaveSettings,
  onUpdateThemePrefs,
  onResetThemePrefs,
  onClearSearchCache,
}: SettingsModalProps) {
  const { language, setLanguage, t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsModalTab>(initialTab);
  const [apiKey, setApiKey] = useState(settings.youtubeApiKey);
  const [showCompactVideo, setShowCompactVideo] = useState(settings.showCompactVideo);
  const [revealKey, setRevealKey] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationNote, setVerificationNote] = useState<string | null>(null);

  const envApiKey = getEnvYouTubeApiKey();
  const effectiveInfo = getEffectiveYouTubeApiKey(apiKey);
  const accentOptions = getLocalizedAccentOptions(language);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setApiKey(settings.youtubeApiKey);
      setShowCompactVideo(settings.showCompactVideo);
      setRevealKey(false);
      setAdvancedOpen(Boolean(settings.youtubeApiKey));
      setVerificationNote(null);
    }
  }, [open, initialTab, settings]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      youtubeApiKey: apiKey.trim(),
      showCompactVideo,
    });
    onClose();
  };

  const setAccent = (accentColor: AccentColorPreset) => {
    onUpdateThemePrefs({ ...themePrefs, accentColor });
  };

  const setDensity = (layoutDensity: LayoutDensity) => {
    onUpdateThemePrefs({ ...themePrefs, layoutDensity });
  };

  const setPlayerStyle = (playerBarStyle: PlayerBarStyle) => {
    onUpdateThemePrefs({ ...themePrefs, playerBarStyle });
  };

  const isDefaultTheme =
    themePrefs.accentColor === DEFAULT_THEME_PREFS.accentColor &&
    themePrefs.glassIntensity === DEFAULT_THEME_PREFS.glassIntensity &&
    themePrefs.ambientGlowEnabled === DEFAULT_THEME_PREFS.ambientGlowEnabled &&
    themePrefs.ambientGlowIntensity === DEFAULT_THEME_PREFS.ambientGlowIntensity &&
    themePrefs.layoutDensity === DEFAULT_THEME_PREFS.layoutDensity &&
    themePrefs.playerBarStyle === DEFAULT_THEME_PREFS.playerBarStyle;

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
          aria-labelledby="settings-modal-title"
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
              <div>
                <h2 id="settings-modal-title" className="text-lg font-semibold text-white">
                  {t.settingsTitle}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">{t.settingsSubtitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.settingsCloseAria}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Segmented Tab Switcher */}
            <div
              role="tablist"
              aria-label={t.settingsTitle}
              className="grid grid-cols-2 gap-1.5 p-1 rounded-xl liquid-glass-subtle"
            >
              <button
                role="tab"
                type="button"
                aria-selected={activeTab === 'theme'}
                onClick={() => setActiveTab('theme')}
                className={`relative flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'theme'
                    ? 'text-zinc-950'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {activeTab === 'theme' && (
                  <AnimatedTabIndicator
                    layoutId="settings-tab-pill"
                    className="rounded-lg bg-white shadow-sm"
                  />
                )}
                <Palette className="relative z-10 w-3.5 h-3.5" />
                <span className="relative z-10">{t.settingsTabTheme}</span>
              </button>
              <button
                role="tab"
                type="button"
                aria-selected={activeTab === 'api'}
                onClick={() => setActiveTab('api')}
                className={`relative flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'api'
                    ? 'text-zinc-950'
                    : 'text-zinc-300 hover:text-white'
                }`}
              >
                {activeTab === 'api' && (
                  <AnimatedTabIndicator
                    layoutId="settings-tab-pill"
                    className="rounded-lg bg-white shadow-sm"
                  />
                )}
                <Cloud className="relative z-10 w-3.5 h-3.5" />
                <span className="relative z-10">{t.settingsTabAccount}</span>
              </button>
            </div>

            {activeTab === 'theme' ? (
              <div className="space-y-5">
                {/* 0. Language Switcher (Türkçe / English) */}
                <div className="rounded-xl liquid-glass-subtle p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t.settingsLanguageLabel}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{t.settingsLanguageDesc}</p>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label={t.settingsLanguageLabel}
                    className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-black/30 border border-white/[0.07] shrink-0"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={language === 'tr'}
                      onClick={() => {
                        if (language !== 'tr') {
                          setLanguage('tr');
                          onLanguageChanged?.('tr');
                        }
                      }}
                      className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        language === 'tr'
                          ? 'bg-white text-zinc-950 font-semibold'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      Türkçe
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={language === 'en'}
                      onClick={() => {
                        if (language !== 'en') {
                          setLanguage('en');
                          onLanguageChanged?.('en');
                        }
                      }}
                      className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        language === 'en'
                          ? 'bg-white text-zinc-950 font-semibold'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* 1. Accent Color Picker */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t.settingsAccentColor}</span>
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      {accentOptions.find((o) => o.id === themePrefs.accentColor)?.label}
                    </span>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label={t.settingsAccentColor}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                  >
                    {accentOptions.map((opt) => {
                      const selected = themePrefs.accentColor === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setAccent(opt.id)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                            selected
                              ? 'liquid-glass ring-1 ring-rose-500/60 text-white'
                              : 'liquid-glass-subtle hover:bg-white/[0.08] text-zinc-300'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className="w-4 h-4 rounded-full shrink-0 border border-white/25 shadow-sm"
                            style={{ background: opt.swatchHex }}
                          />
                          <span className="text-xs font-medium truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Glassmorphism Intensity & Ambient Glow */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Glassmorphism Intensity Slider */}
                  <div className="rounded-xl liquid-glass-subtle p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="glass-intensity-slider"
                        className="text-xs font-medium text-white flex items-center gap-1.5"
                      >
                        <Sliders className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t.settingsGlassIntensity}</span>
                      </label>
                      <span className="text-xs text-rose-400 font-mono-tabular">
                        {themePrefs.glassIntensity}%
                      </span>
                    </div>
                    <input
                      id="glass-intensity-slider"
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={themePrefs.glassIntensity}
                      onChange={(e) =>
                        onUpdateThemePrefs({
                          ...themePrefs,
                          glassIntensity: Number(e.target.value),
                        })
                      }
                      aria-label={t.settingsGlassIntensity}
                      className="w-full h-1.5 accent-white cursor-pointer bg-white/[0.16] rounded-full"
                    />
                    <p className="text-[11px] text-zinc-400">{t.settingsGlassDesc}</p>
                  </div>

                  {/* Ambient Glow Toggle & Intensity */}
                  <div className="rounded-xl liquid-glass-subtle p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="ambient-glow-slider"
                        className="text-xs font-medium text-white flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                        <span>{t.settingsAmbientGlow}</span>
                      </label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={themePrefs.ambientGlowEnabled}
                        aria-label={t.settingsAmbientGlow}
                        onClick={() =>
                          onUpdateThemePrefs({
                            ...themePrefs,
                            ambientGlowEnabled: !themePrefs.ambientGlowEnabled,
                          })
                        }
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                          themePrefs.ambientGlowEnabled
                            ? 'bg-rose-500 text-white'
                            : 'bg-white/[0.08] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {themePrefs.ambientGlowEnabled
                          ? `${themePrefs.ambientGlowIntensity}%`
                          : t.off}
                      </button>
                    </div>
                    <input
                      id="ambient-glow-slider"
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      disabled={!themePrefs.ambientGlowEnabled}
                      value={themePrefs.ambientGlowIntensity}
                      onChange={(e) =>
                        onUpdateThemePrefs({
                          ...themePrefs,
                          ambientGlowIntensity: Number(e.target.value),
                        })
                      }
                      aria-label={t.settingsAmbientGlow}
                      className="w-full h-1.5 accent-white cursor-pointer bg-white/[0.16] rounded-full disabled:opacity-35"
                    />
                    <p className="text-[11px] text-zinc-400">{t.settingsAmbientDesc}</p>
                  </div>
                </div>

                {/* 3. Layout Density & Player Bar Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Layout Density */}
                  <div className="rounded-xl liquid-glass-subtle p-3.5 space-y-2.5">
                    <div className="text-xs font-medium text-white flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t.settingsLayoutDensity}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-black/30 border border-white/[0.07]">
                      <button
                        type="button"
                        onClick={() => setDensity('comfortable')}
                        aria-pressed={themePrefs.layoutDensity === 'comfortable'}
                        className={`py-1.5 px-2.5 rounded-md text-xs font-medium transition-colors ${
                          themePrefs.layoutDensity === 'comfortable'
                            ? 'bg-white text-zinc-950 font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {t.settingsDensityComfortable}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDensity('compact')}
                        aria-pressed={themePrefs.layoutDensity === 'compact'}
                        className={`py-1.5 px-2.5 rounded-md text-xs font-medium transition-colors ${
                          themePrefs.layoutDensity === 'compact'
                            ? 'bg-white text-zinc-950 font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {t.settingsDensityCompact}
                      </button>
                    </div>
                  </div>

                  {/* Player Bar Style */}
                  <div className="rounded-xl liquid-glass-subtle p-3.5 space-y-2.5">
                    <div className="text-xs font-medium text-white flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t.settingsPlayerBarStyle}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-black/30 border border-white/[0.07]">
                      <button
                        type="button"
                        onClick={() => setPlayerStyle('docked')}
                        aria-pressed={themePrefs.playerBarStyle === 'docked'}
                        className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                          themePrefs.playerBarStyle === 'docked'
                            ? 'bg-white text-zinc-950 font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {t.settingsPlayerDocked}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlayerStyle('floating')}
                        aria-pressed={themePrefs.playerBarStyle === 'floating'}
                        className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                          themePrefs.playerBarStyle === 'floating'
                            ? 'bg-white text-zinc-950 font-semibold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {t.settingsPlayerFloating}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer Actions for Theme Tab */}
                <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    disabled={isDefaultTheme}
                    onClick={onResetThemePrefs}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium liquid-glass-subtle hover:bg-white/[0.12] disabled:opacity-35 text-zinc-300 hover:text-white transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.settingsResetTheme}</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors shadow-lg shadow-rose-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.done}</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Cloud Sync & Verification Section */}
                <div className="rounded-xl liquid-glass-subtle p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      {cloudUser?.photoURL ? (
                        <img
                          src={cloudUser.photoURL}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                          <Cloud className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {cloudUser
                            ? cloudUser.displayName || cloudUser.email || t.settingsCloudAccountActive
                            : t.settingsCloudGuest}
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {cloudUser
                            ? cloudUser.emailVerified === false
                              ? t.settingsCloudUnverifiedDesc
                              : t.settingsCloudSyncedDesc
                            : t.settingsCloudSignInPrompt}
                        </div>
                      </div>
                    </div>

                    {cloudUser ? (
                      <button
                        type="button"
                        onClick={onSignOutCloud}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 hover:text-white transition-colors whitespace-nowrap shrink-0"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t.settingsSignOut}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSigningIn}
                        onClick={onSignInGoogle}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{isSigningIn ? t.sidebarSigningIn : t.sidebarSignInGoogle}</span>
                      </button>
                    )}
                  </div>

                  {cloudUser && cloudUser.emailVerified === false && (
                    <div className="pt-2.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {onResendVerification && (
                          <button
                            type="button"
                            disabled={verificationBusy}
                            onClick={async () => {
                              setVerificationBusy(true);
                              setVerificationNote(null);
                              try {
                                await onResendVerification();
                                setVerificationNote(t.settingsVerificationSent);
                              } finally {
                                setVerificationBusy(false);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/35 text-rose-200 transition-colors"
                          >
                            <MailCheck className="w-3.5 h-3.5" />
                            <span>{t.settingsResendVerification}</span>
                          </button>
                        )}
                        {onRefreshVerification && (
                          <button
                            type="button"
                            disabled={verificationBusy}
                            onClick={async () => {
                              setVerificationBusy(true);
                              try {
                                await onRefreshVerification();
                              } finally {
                                setVerificationBusy(false);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>{t.settingsRefreshVerification}</span>
                          </button>
                        )}
                      </div>
                      {verificationNote && (
                        <span className="text-[11px] text-emerald-300">{verificationNote}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Video Player Display Mode */}
                <div className="rounded-xl liquid-glass-subtle p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Tv className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-white">
                        {t.settingsCompactVideoTitle}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {t.settingsCompactVideoDesc}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={showCompactVideo}
                    aria-label={t.settingsCompactVideoTitle}
                    onClick={() => setShowCompactVideo((prev) => !prev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      showCompactVideo
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/[0.07] text-zinc-300 hover:text-white'
                    }`}
                  >
                    {showCompactVideo ? t.settingsCompactVideoVisible : t.settingsCompactVideoHidden}
                  </button>
                </div>

                {/* Search Cache */}
                <div className="rounded-xl liquid-glass-subtle p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Database className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-white">
                        {t.settingsCacheTitle} ·{' '}
                        <span className="tabular-nums text-rose-400">
                          {t.searchesCount(cachedQueryCount)}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">{t.settingsCacheDesc}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={cachedQueryCount === 0}
                    onClick={onClearSearchCache}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-35 text-zinc-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.settingsClearCache}</span>
                  </button>
                </div>

                {/* Collapsed Advanced Section for Optional YouTube API Key Override */}
                <div className="rounded-xl liquid-glass-subtle overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={advancedOpen}
                    onClick={() => setAdvancedOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{t.settingsAdvanced}</span>
                      <span className="text-[11px] text-zinc-500">
                        ·{' '}
                        {effectiveInfo.source === 'override'
                          ? t.settingsAdvancedCustomKey
                          : envApiKey
                            ? t.settingsAdvancedSecrets
                            : t.settingsAdvancedDefault}
                      </span>
                    </span>
                    {advancedOpen ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>

                  {advancedOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-2">
                      <label
                        htmlFor="youtube-api-key-input"
                        className="block text-xs font-medium text-zinc-300"
                      >
                        {t.settingsCustomYtKeyLabel}
                      </label>
                      <div className="relative">
                        <input
                          id="youtube-api-key-input"
                          type={revealKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={
                            envApiKey
                              ? t.settingsCustomYtKeyPlaceholderSecrets
                              : t.settingsCustomYtKeyPlaceholderDefault
                          }
                          className="w-full pl-3.5 pr-16 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/70 font-mono"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {apiKey && (
                            <button
                              type="button"
                              onClick={() => setApiKey('')}
                              aria-label={t.settingsClearApiKeyAria}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setRevealKey((prev) => !prev)}
                            aria-label={
                              revealKey ? t.settingsHideApiKeyAria : t.settingsShowApiKeyAria
                            }
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                          >
                            {revealKey ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors whitespace-nowrap shrink-0 shadow-lg shadow-rose-500/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t.settingsSaveButton}</span>
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
