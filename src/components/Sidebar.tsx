import {
  AudioLines,
  Cloud,
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
  Upload,
} from 'lucide-react';
import type { CloudUserProfile, NavTab, Playlist } from '../types/music';
import { useI18n } from '../utils/I18nContext';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  activeTab: NavTab;
  selectedPlaylistId: string | null;
  playlists: Playlist[];
  cloudUser: CloudUserProfile | null;
  isSigningIn?: boolean;
  onSelectTab: (tab: NavTab) => void;
  onSelectPlaylist: (playlistId: string) => void;
  onOpenNewPlaylist: () => void;
  onTriggerUpload: () => void;
  onOpenLinkImport: () => void;
  onOpenThemeCustomizer: () => void;
  onOpenSettings: () => void;
  onSignInGoogle: () => void;
  onSignOutCloud: () => void;
}

export function Sidebar({
  activeTab,
  selectedPlaylistId,
  playlists,
  cloudUser,
  isSigningIn = false,
  onSelectTab,
  onSelectPlaylist,
  onOpenNewPlaylist,
  onTriggerUpload,
  onOpenLinkImport,
  onOpenThemeCustomizer,
  onOpenSettings,
  onSignInGoogle,
  onSignOutCloud,
}: SidebarProps) {
  const { t } = useI18n();

  const navItems: { id: NavTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'search', label: t.navSearch, icon: Search },
    { id: 'library', label: t.navLibrary, icon: Library },
  ];

  return (
    <aside
      aria-label={t.navPrimaryAria}
      className="hidden md:flex flex-col w-[240px] shrink-0 h-full liquid-glass border-y-0 border-l-0 border-r border-white/[0.09] px-3 py-5 select-none"
    >
      {/* Brand Lockup */}
      <div className="flex items-center gap-2.5 px-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <AudioLines className="w-4 h-4 text-white" />
        </div>
        <span className="font-display text-lg font-semibold tracking-tight text-white whitespace-nowrap">
          {t.appName}
        </span>
      </div>

      {/* Main Nav */}
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-white/[0.11] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-400' : ''}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="mt-5 pt-4 border-t border-white/[0.08] space-y-1">
        <button
          type="button"
          onClick={onOpenLinkImport}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors whitespace-nowrap"
        >
          <Link2 className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{t.actionLinkImport}</span>
        </button>

        <button
          type="button"
          onClick={onTriggerUpload}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap"
        >
          <Upload className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>{t.actionUploadAudio}</span>
        </button>

        <button
          type="button"
          onClick={onOpenNewPlaylist}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>{t.actionNewPlaylist}</span>
        </button>

        <button
          type="button"
          onClick={onOpenThemeCustomizer}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap"
        >
          <Palette className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{t.actionCustomizeTheme}</span>
        </button>
      </div>

      {/* Playlists List */}
      <div className="mt-5 flex-1 min-h-0 flex flex-col">
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

      {/* Cloud Sync Profile, Install App & Settings Footer */}
      <div className="pt-3 mt-3 border-t border-white/[0.08] space-y-1.5">
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
                <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                  <Cloud className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {cloudUser.displayName || cloudUser.email || t.sidebarCloudSynced}
                </div>
                <div className="text-[10px] text-rose-400 truncate">
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
