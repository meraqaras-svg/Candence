import { Home, Library, Link2, Palette, Search } from 'lucide-react';
import type { NavTab } from '../types/music';
import { useI18n } from '../utils/I18nContext';
import { AnimatedTabIndicator } from './MotionPrimitives';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenLinkImport: () => void;
  onOpenThemeCustomizer: () => void;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  onOpenLinkImport,
  onOpenThemeCustomizer,
}: MobileBottomNavProps) {
  const { t } = useI18n();

  const navItems: { id: NavTab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: t.navHome, icon: Home },
    { id: 'search', label: t.navSearch, icon: Search },
    { id: 'library', label: t.navLibrary, icon: Library },
  ];

  return (
    <nav
      aria-label={t.navMobileAria}
      className="md:hidden relative z-30 shrink-0 liquid-glass border-t border-white/[0.12] px-2 py-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-medium transition-colors active:scale-95 ${
                active ? 'text-white' : 'text-zinc-400'
              }`}
            >
              {active && (
                <AnimatedTabIndicator
                  layoutId="mobile-nav-pill"
                  className="bg-white/[0.11] rounded-xl border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16)]"
                />
              )}
              <Icon className={`w-4 h-4 relative z-10 ${active ? 'text-rose-400' : ''}`} />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onOpenLinkImport}
          className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-medium text-zinc-400 active:scale-95 transition-transform"
        >
          <Link2 className="w-4 h-4 text-rose-400" />
          <span>{t.navImportShort}</span>
        </button>

        <button
          type="button"
          onClick={onOpenThemeCustomizer}
          className="flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-medium text-zinc-400 active:scale-95 transition-transform"
        >
          <Palette className="w-4 h-4 text-rose-400" />
          <span>{t.navThemeShort}</span>
        </button>
      </div>
    </nav>
  );
}
