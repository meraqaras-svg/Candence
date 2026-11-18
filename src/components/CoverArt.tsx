import { useState } from 'react';
import { Disc3 } from 'lucide-react';

interface CoverArtProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isPlaying?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<CoverArtProps['size']>, string> = {
  xs: 'w-10 h-10 rounded-md',
  sm: 'w-12 h-12 rounded-lg',
  md: 'w-14 h-14 rounded-lg',
  lg: 'w-full aspect-square rounded-xl',
  xl: 'w-64 h-64 sm:w-80 sm:h-80 rounded-2xl',
};

export function CoverArt({
  src,
  alt,
  size = 'md',
  isPlaying = false,
  className = '',
}: CoverArtProps) {
  const [failed, setFailed] = useState(false);

  const showFallback = !src || failed;

  return (
    <div
      className={`relative overflow-hidden shrink-0 bg-zinc-900 border border-white/[0.08] select-none ${SIZE_CLASSES[size]} ${className}`}
    >
      {showFallback ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 text-zinc-500">
          <Disc3
            className={
              size === 'xl'
                ? 'w-16 h-16 stroke-[1.25]'
                : size === 'lg'
                  ? 'w-10 h-10 stroke-[1.5]'
                  : 'w-5 h-5 stroke-[1.5]'
            }
          />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover transition-transform duration-300"
        />
      )}

      {isPlaying && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-black/35 flex items-end justify-center gap-0.5 p-2"
        >
          <span className="w-0.5 h-3 bg-white rounded-full animate-pulse" />
          <span className="w-0.5 h-4 bg-white rounded-full animate-pulse [animation-delay:150ms]" />
          <span className="w-0.5 h-2.5 bg-white rounded-full animate-pulse [animation-delay:300ms]" />
        </div>
      )}
    </div>
  );
}
