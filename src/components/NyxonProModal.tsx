import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  ExternalLink,
  HardDrive,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
  VolumeX,
  X,
} from 'lucide-react';
import type { CloudUserProfile, PaymentAdConfig, UserPlan } from '../types/music';
import { isUserAdFree } from '../utils/audioAdEngine';
import { redeemPromoCode } from '../utils/firebaseSync';
import { useI18n } from '../utils/I18nContext';
import { NYXON_SPRING } from './MotionPrimitives';
import { NyxonLogo } from './NyxonLogo';

interface NyxonProModalProps {
  open: boolean;
  cloudUser: CloudUserProfile | null;
  userPlan: UserPlan;
  paymentConfig: PaymentAdConfig;
  onClose: () => void;
  onProUnlocked: () => void;
}

export function NyxonProModal({
  open,
  cloudUser,
  userPlan,
  paymentConfig,
  onClose,
  onProUnlocked,
}: NyxonProModalProps) {
  const { t } = useI18n();
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const isPro = isUserAdFree(userPlan, cloudUser?.email);

  useEffect(() => {
    if (open) {
      setPromoCode('');
      setRedeemError(null);
      setRedeemSuccess(false);
      setIsRedeeming(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudUser) return;
    setRedeemError(null);
    setRedeemSuccess(false);

    if (!promoCode.trim()) {
      setRedeemError(t.proRedeemErrorEmpty);
      return;
    }

    setIsRedeeming(true);
    try {
      const result = await redeemPromoCode(cloudUser.uid, cloudUser.email, promoCode);
      if (result.ok) {
        setRedeemSuccess(true);
        setPromoCode('');
        onProUnlocked();
      } else if (result.reason === 'empty') {
        setRedeemError(t.proRedeemErrorEmpty);
      } else if (result.reason === 'invalid') {
        setRedeemError(t.proRedeemErrorInvalid);
      } else if (result.reason === 'used') {
        setRedeemError(t.proRedeemErrorUsed);
      } else {
        setRedeemError(result.message || t.proRedeemErrorInvalid);
      }
    } finally {
      setIsRedeeming(false);
    }
  };

  if (typeof document === 'undefined') return null;

  const checkoutUrl = paymentConfig.checkoutUrl.trim();
  const hasValidCheckoutUrl = /^https?:\/\//i.test(checkoutUrl);

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
          aria-labelledby="nyxon-pro-modal-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={NYXON_SPRING}
            className="relative w-full max-w-lg max-h-[85dvh] overflow-y-auto rounded-3xl liquid-glass-modal glass-noise p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle top refraction halo */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-36 rounded-full blur-3xl opacity-45"
              style={{
                background:
                  'linear-gradient(90deg, rgba(139,92,246,0.55) 0%, rgba(34,211,238,0.45) 100%)',
              }}
            />

            {/* Header */}
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <NyxonLogo size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      id="nyxon-pro-modal-title"
                      className="text-lg font-bold tracking-tight text-white"
                    >
                      {t.proModalTitle}
                    </h2>
                    <Crown className="w-4 h-4 text-amber-300 shrink-0" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.proModalSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.proModalCloseAria}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plan Status Summary */}
            <div className="relative rounded-2xl liquid-glass-subtle p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-medium text-zinc-400">
                  {t.proCurrentPlanLabel}
                </div>
                <div className="text-sm font-semibold text-white mt-0.5 flex items-center gap-2">
                  <span>{isPro ? t.planProLabel : t.planFreeLabel}</span>
                  {cloudUser?.email && (
                    <span className="text-xs font-normal text-zinc-400 truncate">
                      · {cloudUser.email}
                    </span>
                  )}
                </div>
              </div>
              {isPro && (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Active Pro Banner OR Purchase + Redeem Flow */}
            {isPro ? (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/25 p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">{t.proAlreadyActiveTitle}</div>
                  <p className="text-xs text-emerald-100/80 leading-relaxed">
                    {t.proAlreadyActiveDesc}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Pro Benefits */}
                <ul className="space-y-2.5 text-xs text-zinc-200">
                  <li className="flex items-start gap-2.5">
                    <VolumeX className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                    <span>{t.proBenefitNoAds}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <HardDrive className="w-4 h-4 text-violet-300 shrink-0 mt-0.5" />
                    <span>{t.proBenefitOfflineVault}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                    <span>{t.proBenefitCloudSync}</span>
                  </li>
                </ul>

                {/* Shopier / Payment Checkout CTA */}
                <div className="rounded-2xl liquid-glass-subtle p-4 space-y-2.5">
                  {hasValidCheckoutUrl ? (
                    <a
                      href={checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 hover:brightness-110 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
                    >
                      <Crown className="w-4 h-4" />
                      <span>{t.proBuyButton}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-90" />
                    </a>
                  ) : (
                    <div className="rounded-xl bg-white/[0.04] border border-white/[0.09] px-3.5 py-2.5 text-xs text-zinc-300 leading-relaxed">
                      {t.proBuyNoLinkConfigured}
                    </div>
                  )}
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {t.proBuyNoteReminder}
                  </p>
                </div>

                {/* 1-Time Promo Code Redemption */}
                <form
                  onSubmit={handleRedeem}
                  className="rounded-2xl liquid-glass-subtle p-4 space-y-3"
                >
                  <label
                    htmlFor="nyxon-promo-code-input"
                    className="flex items-center gap-1.5 text-xs font-semibold text-white"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{t.proRedeemTitle}</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="nyxon-promo-code-input"
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        if (redeemError) setRedeemError(null);
                      }}
                      placeholder={t.proRedeemPlaceholder}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] text-sm font-mono tracking-wider uppercase text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400/70"
                    />
                    <button
                      type="submit"
                      disabled={isRedeeming}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
                    >
                      {isRedeeming ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{t.proRedeeming}</span>
                        </>
                      ) : (
                        <span>{t.proRedeemButton}</span>
                      )}
                    </button>
                  </div>

                  {redeemError && (
                    <div
                      role="alert"
                      className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-xs text-rose-200 flex items-start gap-2"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{redeemError}</span>
                    </div>
                  )}

                  {redeemSuccess && (
                    <div
                      role="status"
                      className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-3 py-2 text-xs text-emerald-200 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{t.proRedeemSuccess}</span>
                    </div>
                  )}
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
