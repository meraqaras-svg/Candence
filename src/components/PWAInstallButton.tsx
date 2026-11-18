import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Smartphone, X } from 'lucide-react';
import { useI18n } from '../utils/I18nContext';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export function PWAInstallButton({ compact = false }: PWAInstallButtonProps) {
  const { t } = useI18n();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  const guideModal =
    showGuide && typeof document !== 'undefined'
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.pwaInstallAria}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowGuide(false)}
          >
            <div
              className="w-full max-w-sm max-h-[85dvh] overflow-y-auto rounded-2xl liquid-glass-modal p-5 space-y-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{t.pwaGuideTitle}</h3>
                    <p className="text-[11px] text-zinc-400">{t.pwaGuideSubtitle}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  aria-label={t.pwaGuideCloseAria}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300 leading-relaxed">
                <div className="rounded-xl liquid-glass-subtle p-3 space-y-1">
                  <div className="font-semibold text-white">{t.pwaAndroidTitle}</div>
                  <p className="text-zinc-400">
                    {t.pwaAndroidBodyPre}
                    <strong>⋮</strong> → <strong className="text-white">{t.pwaAndroidOption1}</strong>
                    {t.pwaAndroidBodyMid}
                    <strong className="text-white">{t.pwaAndroidOption2}</strong>.
                  </p>
                </div>
                <div className="rounded-xl liquid-glass-subtle p-3 space-y-1">
                  <div className="font-semibold text-white">{t.pwaIosTitle}</div>
                  <p className="text-zinc-400">
                    {t.pwaIosBodyPre}
                    <strong>{t.pwaIosShare}</strong>
                    {t.pwaIosBodyMid}
                    <strong className="text-white">{t.pwaIosAddHome}</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-colors"
              >
                {t.pwaGotIt}
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={t.pwaInstallAria}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium liquid-glass-subtle hover:bg-white/[0.12] text-zinc-200 hover:text-white transition-colors whitespace-nowrap shrink-0'
            : 'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium text-zinc-300 hover:text-white liquid-glass-subtle hover:bg-white/[0.1] transition-colors whitespace-nowrap'
        }
      >
        <span className="flex items-center gap-2">
          <Download className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{isIOS ? t.pwaInstallIos : t.pwaInstallApp}</span>
        </span>
      </button>

      {guideModal}
    </>
  );
}
