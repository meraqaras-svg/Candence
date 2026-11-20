import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import type { CloudUserProfile } from '../types/music';
import { useI18n } from '../utils/I18nContext';
import {
  mapFirebaseAuthError,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
  validateEmailPasswordInput,
} from '../utils/firebaseSync';
import { AnimatedTabIndicator, NYXON_SPRING } from './MotionPrimitives';
import { NyxonLogo } from './NyxonLogo';

interface AuthGateProps {
  onAuthenticated: (user: CloudUserProfile, isNewSignUp?: boolean) => void;
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const { language, setLanguage, t } = useI18n();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);

  const switchMode = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    setErrorMsg(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validationError = validateEmailPasswordInput(email, password, mode, language);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsSubmittingEmail(true);
    try {
      if (mode === 'signin') {
        const profile = await signInWithEmail(email, password);
        onAuthenticated(profile, false);
      } else {
        const profile = await signUpWithEmail(email, password, displayName);
        onAuthenticated(profile, true);
      }
    } catch (err) {
      setErrorMsg(mapFirebaseAuthError(err, language));
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsSigningInGoogle(true);
    try {
      const profile = await signInWithGoogle();
      onAuthenticated(profile, false);
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code || '')
          : '';
      if (!code.includes('popup-closed-by-user')) {
        setErrorMsg(mapFirebaseAuthError(err, language));
      }
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const busy = isSubmittingEmail || isSigningInGoogle;

  return (
    <div className="min-h-dvh h-dvh w-screen relative overflow-y-auto bg-[#050508] text-zinc-100 flex flex-col justify-between px-4 py-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {/* Seamless Full-Viewport Prismatic Refraction Backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 h-dvh w-screen pointer-events-none z-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 55% at 24% 0%, rgba(139, 92, 246, 0.22) 0%, transparent 72%), radial-gradient(ellipse 75% 55% at 82% 100%, rgba(34, 211, 238, 0.16) 0%, transparent 72%)',
        }}
      />

      {/* Top Bar: NYXON Brand + Spring Language Switcher */}
      <header className="relative z-10 w-full max-w-md mx-auto flex items-center justify-between">
        <NyxonLogo size="sm" showWordmark />

        <div
          role="group"
          aria-label={t.settingsLanguageLabel}
          className="inline-flex items-center gap-1 p-1 rounded-xl liquid-glass-subtle"
        >
          <Globe className="w-3.5 h-3.5 text-zinc-400 ml-1.5 mr-0.5 shrink-0" />
          {(['tr', 'en'] as const).map((langOption) => {
            const active = language === langOption;
            return (
              <button
                key={langOption}
                type="button"
                onClick={() => setLanguage(langOption)}
                aria-pressed={active}
                className={`relative px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  active ? 'text-zinc-950' : 'text-zinc-300 hover:text-white'
                }`}
              >
                {active && <AnimatedTabIndicator layoutId="auth-lang-pill" />}
                <span className="relative z-10 uppercase">{langOption}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Center Flagship Liquid Glass Auth Card */}
      <main className="relative z-10 w-full max-w-md mx-auto my-auto py-5">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={NYXON_SPRING}
          className="rounded-3xl nyxon-glass-panel glass-noise p-6 sm:p-8 space-y-6"
        >
          <div className="text-center space-y-2.5">
            <div className="flex justify-center mb-1">
              <NyxonLogo size="xl" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {t.authWelcomeTitle}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              {t.authWelcomeSubtitle}
            </p>
          </div>

          {/* Mode Tabs with layoutId Spring Physics */}
          <div
            role="tablist"
            aria-label={t.authTabSignIn}
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.1]"
          >
            {(
              [
                { id: 'signin', label: t.authTabSignIn },
                { id: 'signup', label: t.authTabSignUp },
              ] as const
            ).map((tab) => {
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => switchMode(tab.id)}
                  className={`relative py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    active ? 'text-zinc-950' : 'text-zinc-300 hover:text-white'
                  }`}
                >
                  {active && <AnimatedTabIndicator layoutId="auth-mode-tab" />}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} noValidate className="space-y-4">
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={NYXON_SPRING}
              >
                <label
                  htmlFor="auth-display-name"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  {t.authDisplayNameLabel}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="auth-display-name"
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t.authDisplayNamePlaceholder}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.12] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-400/70"
                  />
                </div>
              </motion.div>
            )}

            <div>
              <label
                htmlFor="auth-email-input"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                {t.authEmailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-email-input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={t.authEmailPlaceholder}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.12] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-400/70"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="auth-password-input"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                {t.authPasswordLabel}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={t.authPasswordPlaceholder}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.12] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-400/70"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? t.authHidePassword : t.authShowPassword}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl bg-rose-500/15 border border-rose-500/35 px-3.5 py-2.5 text-xs text-rose-200 flex items-start gap-2 leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={busy}
              whileTap={{ scale: 0.985 }}
              transition={NYXON_SPRING}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-600 border-t border-white/25 hover:brightness-110 disabled:opacity-50 text-white transition shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {isSubmittingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.authSubmitting}</span>
                </>
              ) : (
                <span>{mode === 'signin' ? t.authSubmitSignIn : t.authSubmitSignUp}</span>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-white/[0.09]" />
            <span className="px-3 text-xs text-zinc-500 bg-transparent">
              {t.authDividerOr}
            </span>
            <div className="w-full border-t border-white/[0.09]" />
          </div>

          {/* Google Sign-In */}
          <motion.button
            type="button"
            disabled={busy}
            whileTap={{ scale: 0.985 }}
            transition={NYXON_SPRING}
            onClick={handleGoogleLogin}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2.5 shadow-md"
          >
            {isSigningInGoogle ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.94 0 3.51.68 4.74 1.8l3.52-3.52C18.11 1.32 15.27 0 12 0 7.31 0 3.25 2.69 1.28 6.61l4.12 3.19C6.37 6.91 8.96 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.87 3c2.26-2.09 3.55-5.17 3.55-8.82z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.4 14.2c-.23-.68-.36-1.4-.36-2.2s.13-1.52.36-2.2L1.28 6.61C.47 8.23 0 10.06 0 12s.47 3.77 1.28 5.39l4.12-3.19z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.04 0-5.63-1.87-6.6-4.76l-4.12 3.19C3.25 21.31 7.31 24 12 24z"
                />
              </svg>
            )}
            <span>
              {isSigningInGoogle ? t.authGoogleSigningIn : t.authGoogleButton}
            </span>
          </motion.button>
        </motion.div>
      </main>

      <footer className="relative z-10 text-center text-xs text-zinc-500">
        {t.authGateNotice}
      </footer>
    </div>
  );
}
