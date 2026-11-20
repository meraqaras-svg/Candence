import { useId } from 'react';

interface NyxonLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
}

const SIZE_MAP = {
  xs: { box: 'w-7 h-7', svg: 28, text: 'text-sm tracking-[0.18em]' },
  sm: { box: 'w-8 h-8', svg: 32, text: 'text-base tracking-[0.2em]' },
  md: { box: 'w-10 h-10', svg: 40, text: 'text-lg tracking-[0.22em]' },
  lg: { box: 'w-12 h-12', svg: 48, text: 'text-xl tracking-[0.24em]' },
  xl: { box: 'w-14 h-14', svg: 56, text: 'text-2xl tracking-[0.26em]' },
};

export function NyxonLogo({
  size = 'sm',
  showWordmark = false,
  subtitle,
  className = '',
}: NyxonLogoProps) {
  const uid = useId().replace(/:/g, '');
  const dims = SIZE_MAP[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`${dims.box} relative rounded-xl shrink-0 overflow-hidden shadow-[0_8px_24px_-6px_rgba(139,92,246,0.45)] ring-1 ring-white/[0.16]`}
      >
        <svg
          width={dims.svg}
          height={dims.svg}
          viewBox="0 0 512 512"
          fill="none"
          aria-hidden="true"
          className="w-full h-full block"
        >
          <defs>
            <radialGradient id={`nyxBg-${uid}`} cx="25%" cy="18%" r="90%">
              <stop offset="0%" stopColor="#1b1b2e" />
              <stop offset="55%" stopColor="#0b0b13" />
              <stop offset="100%" stopColor="#050508" />
            </radialGradient>
            <radialGradient id={`nyxAura-${uid}`} cx="50%" cy="46%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.38" />
              <stop offset="55%" stopColor="#22d3ee" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`nyxLeft-${uid}`} x1="126" y1="114" x2="188" y2="398" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="45%" stopColor="#c4b5fd" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <linearGradient id={`nyxDiag-${uid}`} x1="142" y1="118" x2="372" y2="394" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#a78bfa" />
              <stop offset="70%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
            <linearGradient id={`nyxRight-${uid}`} x1="328" y1="114" x2="392" y2="398" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id={`nyxGlint-${uid}`} x1="110" y1="24" x2="402" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect width="512" height="512" fill={`url(#nyxBg-${uid})`} />
          <rect width="512" height="512" fill={`url(#nyxAura-${uid})`} />
          <line
            x1="112"
            y1="14"
            x2="400"
            y2="14"
            stroke={`url(#nyxGlint-${uid})`}
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Subtle Acoustic Wave Arcs */}
          <path
            d="M84 206 C68 238 68 274 84 306"
            stroke="#c4b5fd"
            strokeOpacity="0.34"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M428 206 C444 238 444 274 428 306"
            stroke="#38bdf8"
            strokeOpacity="0.34"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Geometric N Prism */}
          <path
            d="M128 394 L128 134 C128 121 139 110 152 110 L184 110 L184 370 C184 383 173 394 160 394 Z"
            fill={`url(#nyxLeft-${uid})`}
          />
          <path
            d="M328 142 C328 129 339 118 352 118 L384 118 L384 378 C384 391 373 402 360 402 L328 402 Z"
            fill={`url(#nyxRight-${uid})`}
          />
          <path
            d="M134 115 C141 110 152 110 164 110 L190 110 L378 377 C385 388 377 402 364 402 L331 402 L134 126 Z"
            fill={`url(#nyxDiag-${uid})`}
          />
          <path
            d="M174 124 L356 380"
            stroke="#ffffff"
            strokeOpacity="0.78"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showWordmark && (
        <div className="min-w-0 leading-none">
          <span
            className={`${dims.text} font-extrabold uppercase bg-gradient-to-r from-white via-zinc-100 to-cyan-200 bg-clip-text text-transparent block`}
          >
            NYXON
          </span>
          {subtitle && (
            <span className="text-[10px] font-medium tracking-wider text-zinc-400 block mt-0.5 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
