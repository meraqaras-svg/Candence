import { motion } from 'framer-motion';
import {
  Cloud,
  Crown,
  Home,
  Library,
  Link2,
  ListMusic,
  LogIn,
  LogOut,
  Palette,
  Plus,
  Search,
  Settings,
  Shield,
  Upload,
} from 'lucide-react';
import type { CloudUserProfile, NavTab, Playlist, UserPlan } from '../types/music';
import { isAdminEmail, isUserAdFree } from '../utils/audioAdEngine';
import { useI18n } from '../utils/I18nContext';
import { AnimatedTabIndicator, NYXON_SPRING } from './MotionPrimitives';
import { NyxonLogo } from './NyxonLogo';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeTab: NavTab;
  selectedPlaylistId: string | null;
  playlists: Playlist[];
  cloudUser: CloudUserProfile | null;
  userPlan: UserPlan;
  isSigningIn?: boolean;
  onSelectTab: (tab: NavTab) => void;
  onSelectPlaylist: (playlistId: string) => void;
  onOpenNewPlaylist: () => void;
  onTriggerUpload: () => void;
  onOpenLinkImport: () => void;
  onOpenThemeCustomizer: () => void;
  onOpenSettings: () => void;
  onOpenProModal: () => void;
  onOpenAdminPanel: () => void;
  onSignInGoogle: () => void;
  onSignOutCloud: () => void;
}

export function Sidebar({
  activeTab,
  selectedPlaylistId,
  playlists,
  cloudUser,
  userPlan,
  isSigningIn = false,
  onSelectTab,
  onSelectPlaylist,
  onOpenNewPlaylist,
  onTriggerUpload,
  onOpenLinkImport,
  onOpenThemeCustomizer,
  onOpenSettings,
  onOpenProModal,
  onOpenAdminPanel,
  onSignInGoogle,
  onSignOutCloud,
}: SidebarProps) {
  const { t } = useI18n();
  const isAdmin = isAdminEmail(cloudUser?.email);
  const isPro = isUserAdFree(userPlan, cloudUser?.email);

  const navItems: { id: NavTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'search', label: t.navSearch, icon: Search },
    { id: 'library', label: t.navLibrary, icon: Library },
  ];

  return (
    <aside
      aria-label={t.navPrimaryAria}
      className="hidden md:flex flex-col w-[248px] shrink-0 h-full liquid-glass glass-noise border-y-0 border-l-0 border-r border-white/[0.1] px-3 py-5 select-none"
    >
      {/* Brand Lockup */}
      <div className="px-2.5 mb-6">
        <NyxonLogo size="sm" showWordmark />
      </div>

      {/* Main Nav with Spring layoutId Indicator */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id && !selectedPlaylistId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                isActive ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <AnimatedTabIndicator
                  layoutId="sidebar-nav-active"
                  className="bg-white/[0.11] rounded-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)] border border-white/[0.08]"
                />
              )}
              <Icon className={`w-4 h-4 shrink-0 relative z-10 ${isActive ? 'text-rose-400' : ''}`} />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-white/[0.08] space-y-1">
        <button
          type="button"
          onClick={onOpenLinkImport}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/18 border border-rose-500/20 transition-colors whitespace-nowrap"
        >
          <Link2 className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{t.actionLinkImport}</span>
        </button>

        <button
          type="button"
          onClick={onTriggerUpload}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap"
        >
          <Upload className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>{t.actionUploadAudio}</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewPlaylist}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>{t.actionNewPlaylist}</span>
        </button>

        <button
          type="button"
          onClick={onOpenThemeCustomizer}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap"
        >
          <Palette className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{t.actionCustomizeTheme}</span>
        </button>
      </div>

      {/* Playlists List */}
      <div className="mt-4 flex-1 min-h-0 flex flex-col">
        <div className="px-3 mb-2 text-xs font-medium text-zinc-500">{t.sidebarPlaylists}</div>
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {playlists.map((playlist) => {
            const isSelected = activeTab === 'library' && selectedPlaylistId === playlist.id;
            return (
              <button
                key={playlist.id}
                type="button"
                onClick={() => onSelectPlaylist(playlist.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  isSelected
                    ? 'bg-white/[0.11] text-white font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14)]'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                <span className="truncate">{playlist.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Membership, Admin (only for meraqaras@gmail.com), Cloud Profile & Settings Footer */}
      <div className="pt-3 mt-3 border-t border-white/[0.08] space-y-1.5">
        {/* NYXON Pro Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          transition={NYXON_SPRING}
          onClick={onOpenProModal}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            isPro
              ? 'bg-emerald-500/12 hover:bg-emerald-500/20 border border-emerald-400/25 text-emerald-200'
              : 'bg-gradient-to-r from-violet-500/20 via-fuchsia-500/18 to-cyan-500/20 hover:from-violet-500/30 hover:to-cyan-500/30 border border-violet-400/30 text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Crown className={`w-3.5 h-3.5 shrink-0 ${isPro ? 'text-emerald-300' : 'text-amber-300'}`} />
            <span>{t.sidebarNyxonPro}</span>
          </span>
          <span className="text-[10px] font-medium opacity-80">
            {isPro ? t.active : t.planFreeLabel}
          </span>
        </motion.button>

        {/* Admin Panel Button — STRICTLY rendered ONLY for meraqaras@gmail.com */}
        {isAdmin && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            transition={NYXON_SPRING}
            onClick={onOpenAdminPanel}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-violet-200 hover:text-white bg-violet-500/14 hover:bg-violet-500/24 border border-violet-400/30 transition-colors whitespace-nowrap"
          >
            <Shield className="w-3.5 h-3.5 text-violet-300 shrink-0" />
            <span>{t.sidebarAdminPanel}</span>
          </motion.button>
        )}

        {cloudUser ? (
          <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl liquid-glass-subtle">
            <div className="flex items-center gap-2 min-w-0">
              {cloudUser.photoURL ? (
                <img
                  src={cloudUser.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover shrink-0 border border-white/20"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-300 shrink-0">
                  <Cloud className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {cloudUser.displayName || cloudUser.email || t.sidebarCloudSynced}
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  {isPro ? t.planProLabel : t.planFreeLabel} ·{' '}
                  {cloudUser.emailVerified === false
                    ? t.sidebarVerifyPending
                    : t.sidebarCloudSynced}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOutCloud}
              aria-label={t.sidebarSignOutAria}
              title={t.sidebarSignOutTitle}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={isSigningIn}
            onClick={onSignInGoogle}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white liquid-glass-subtle hover:bg-white/[0.1] disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <span className="flex items-center gap-2">
              <LogIn className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{isSigningIn ? t.sidebarSigningIn : t.sidebarSignInGoogle}</span>
            </span>
            <Cloud className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          </button>
        )}

        <PWAInstallButton />

        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap"
        >
          <Settings className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>{t.sidebarSettings}</span>
        </button>
      </div>
    </aside>
  );
}
