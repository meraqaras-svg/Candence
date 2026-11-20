import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  KeyRound,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { AdminUserRecord, PaymentAdConfig, PromoCodeRecord, UserPlan } from '../types/music';
import { isAdminEmail } from '../utils/audioAdEngine';
import {
  createPromoCode,
  deletePromoCode,
  listAllUsers,
  listPromoCodes,
  mapFirestoreError,
  savePaymentAdConfig,
  updateUserPlan,
} from '../utils/firebaseSync';
import { useI18n } from '../utils/I18nContext';
import { AnimatedTabIndicator, NYXON_SPRING } from './MotionPrimitives';

type AdminTab = 'users' | 'codes' | 'config';

interface AdminPanelModalProps {
  open: boolean;
  adminEmail: string | null | undefined;
  paymentConfig: PaymentAdConfig;
  onClose: () => void;
}

export function AdminPanelModal({
  open,
  adminEmail,
  paymentConfig,
  onClose,
}: AdminPanelModalProps) {
  const { language, t } = useI18n();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Users state
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  // Promo codes state
  const [codes, setCodes] = useState<PromoCodeRecord[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [creatingCode, setCreatingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Config state
  const [checkoutUrl, setCheckoutUrl] = useState(paymentConfig.checkoutUrl);
  const [customAdAudioUrl, setCustomAdAudioUrl] = useState(paymentConfig.customAdAudioUrl);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const authorized = isAdminEmail(adminEmail);

  const fetchUsers = useCallback(async () => {
    if (!authorized) return;
    setLoadingUsers(true);
    setErrorMsg(null);
    try {
      const list = await listAllUsers();
      setUsers(list);
    } catch (err) {
      setErrorMsg(mapFirestoreError(err, language));
    } finally {
      setLoadingUsers(false);
    }
  }, [authorized, language]);

  const fetchCodes = useCallback(async () => {
    if (!authorized) return;
    setLoadingCodes(true);
    setErrorMsg(null);
    try {
      const list = await listPromoCodes();
      setCodes(list);
    } catch (err) {
      setErrorMsg(mapFirestoreError(err, language));
    } finally {
      setLoadingCodes(false);
    }
  }, [authorized, language]);

  useEffect(() => {
    if (open && authorized) {
      setCheckoutUrl(paymentConfig.checkoutUrl);
      setCustomAdAudioUrl(paymentConfig.customAdAudioUrl);
      setConfigSavedNotice(false);
      setErrorMsg(null);
      void fetchUsers();
      void fetchCodes();
    }
  }, [open, authorized, paymentConfig.checkoutUrl, paymentConfig.customAdAudioUrl, fetchUsers, fetchCodes]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  if (!authorized || typeof document === 'undefined') return null;

  const handleToggleUserPlan = async (user: AdminUserRecord) => {
    const nextPlan: UserPlan = user.plan === 'pro' ? 'free' : 'pro';
    setUpdatingUid(user.uid);
    setErrorMsg(null);
    try {
      await updateUserPlan(user.uid, nextPlan);
      setUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, plan: nextPlan } : u)));
    } catch (err) {
      setErrorMsg(mapFirestoreError(err, language));
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleGenerateCode = async () => {
    setCreatingCode(true);
    setErrorMsg(null);
    try {
      const created = await createPromoCode();
      setCodes((prev) => [created, ...prev]);
    } catch (err) {
      setErrorMsg(mapFirestoreError(err, language));
    } finally {
      setCreatingCode(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode((prev) => (prev === code ? null : prev)), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const handleDeleteCode = async (code: string) => {
    setErrorMsg(null);
    try {
      await deletePromoCode(code);
      setCodes((prev) => prev.filter((c) => c.code !== code));
    } catch (err) {
      setErrorMsg(mapFirestoreError(err, language));
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setErrorMsg(null);
    setConfigSavedNotice(false);
    try {
      await savePaymentAdConfig(checkoutUrl, customAdAudioUrl);
      setConfigSavedNotice(true);
    } catch (err) {
      setErrorMsg(mapFirestoreError(err, language));
    } finally {
      setSavingConfig(false);
    }
  };

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
          aria-labelledby="admin-panel-modal-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={NYXON_SPRING}
            className="w-full max-w-2xl max-h-[85dvh] overflow-y-auto rounded-3xl liquid-glass-modal glass-noise p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/18 border border-violet-400/30 flex items-center justify-center text-violet-300 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="admin-panel-modal-title" className="text-lg font-bold text-white">
                    {t.adminModalTitle}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">{t.adminModalSubtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.adminModalCloseAria}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Spring Segmented Tabs */}
            <div
              role="tablist"
              aria-label={t.adminModalTitle}
              className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/[0.1]"
            >
              {(
                [
                  { id: 'users', label: t.adminTabUsers, icon: Users },
                  { id: 'codes', label: t.adminTabCodes, icon: KeyRound },
                  { id: 'config', label: t.adminTabConfig, icon: Settings2 },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      active ? 'text-zinc-950' : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    {active && <AnimatedTabIndicator layoutId="admin-modal-tab" />}
                    <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl bg-rose-500/15 border border-rose-500/35 px-3.5 py-2.5 text-xs text-rose-200 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: USERS */}
            {activeTab === 'users' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={t.adminSearchUsersPlaceholder}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-400/70"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void fetchUsers()}
                    disabled={loadingUsers}
                    aria-label={t.retry}
                    className="w-9 h-9 rounded-xl liquid-glass-subtle flex items-center justify-center text-zinc-300 hover:text-white transition-colors shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="text-[11px] text-zinc-400 tabular-nums">
                  {t.adminUsersCount(filteredUsers.length)}
                </div>

                {loadingUsers && users.length === 0 ? (
                  <div className="py-10 flex items-center justify-center text-zinc-400 gap-2 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.loading}</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="rounded-2xl liquid-glass-subtle p-6 text-center text-xs text-zinc-400">
                    {t.adminNoUsersFound}
                  </div>
                ) : (
                  <div className="rounded-2xl liquid-glass-subtle divide-y divide-white/[0.06] max-h-[340px] overflow-y-auto">
                    {filteredUsers.map((u) => {
                      const isRowPro = u.plan === 'pro';
                      const isRowUpdating = updatingUid === u.uid;
                      return (
                        <div
                          key={u.uid}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white truncate flex items-center gap-2">
                              <span className="truncate">{u.displayName || u.email}</span>
                              {isRowPro && (
                                <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 truncate mt-0.5">
                              {u.email} · {isRowPro ? t.planProLabel : t.planFreeLabel}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isRowUpdating}
                            onClick={() => void handleToggleUserPlan(u)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                              isRowPro
                                ? 'bg-white/[0.08] hover:bg-white/[0.14] text-zinc-200 border border-white/[0.12]'
                                : 'bg-gradient-to-r from-violet-500 to-cyan-500 hover:brightness-110 text-white'
                            }`}
                          >
                            {isRowUpdating && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>{isRowPro ? t.adminMakeFree : t.adminMakePro}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 1-TIME PROMO CODES */}
            {activeTab === 'codes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={creatingCode}
                    onClick={() => void handleGenerateCode()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-500 to-cyan-500 hover:brightness-110 disabled:opacity-50 text-white transition shadow-lg shadow-violet-500/20"
                  >
                    {creatingCode ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t.adminGeneratingCode}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{t.adminGenerateCode}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => void fetchCodes()}
                    disabled={loadingCodes}
                    aria-label={t.retry}
                    className="w-9 h-9 rounded-xl liquid-glass-subtle flex items-center justify-center text-zinc-300 hover:text-white transition-colors shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingCodes ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {codes.length === 0 ? (
                  <div className="rounded-2xl liquid-glass-subtle p-6 text-center text-xs text-zinc-400">
                    {t.adminNoCodesYet}
                  </div>
                ) : (
                  <div className="rounded-2xl liquid-glass-subtle divide-y divide-white/[0.06] max-h-[340px] overflow-y-auto">
                    {codes.map((item) => (
                      <div
                        key={item.code}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-mono font-semibold tracking-wider text-white">
                            {item.code}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5 truncate">
                            {item.used
                              ? `${t.adminCodeStatusUsed}${
                                  item.usedByEmail ? ` · ${t.adminCodeUsedBy(item.usedByEmail)}` : ''
                                }`
                              : t.adminCodeStatusActive}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => void handleCopyCode(item.code)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/[0.08] hover:bg-white/[0.14] text-zinc-100 transition-colors"
                          >
                            {copiedCode === item.code ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{t.copied}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{t.copy}</span>
                              </>
                            )}
                          </button>

                          {!item.used && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteCode(item.code)}
                              aria-label={t.delete}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-400 hover:bg-white/[0.08] transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SHOPIER PAYMENT & AUDIO AD URL CONFIG */}
            {activeTab === 'config' && (
              <form onSubmit={handleSaveConfig} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-checkout-url"
                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                  >
                    {t.adminCheckoutUrlLabel}
                  </label>
                  <input
                    id="admin-checkout-url"
                    type="url"
                    value={checkoutUrl}
                    onChange={(e) => {
                      setCheckoutUrl(e.target.value);
                      setConfigSavedNotice(false);
                    }}
                    placeholder={t.adminCheckoutUrlPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-400/70"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-custom-ad-url"
                    className="block text-xs font-medium text-zinc-300 mb-1.5"
                  >
                    {t.adminCustomAdUrlLabel}
                  </label>
                  <input
                    id="admin-custom-ad-url"
                    type="url"
                    value={customAdAudioUrl}
                    onChange={(e) => {
                      setCustomAdAudioUrl(e.target.value);
                      setConfigSavedNotice(false);
                    }}
                    placeholder={t.adminCustomAdUrlPlaceholder}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.12] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-400/70"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1.5">{t.adminCustomAdHint}</p>
                </div>

                {configSavedNotice && (
                  <div
                    role="status"
                    className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-3.5 py-2 text-xs text-emerald-200 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t.adminConfigSaved}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={savingConfig}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                  >
                    {savingConfig && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{t.adminSaveConfig}</span>
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
