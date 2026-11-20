import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/**
 * Emil Kowalski-grade snappy spring physics: responsive, zero floaty overshoot.
 */
export const NYXON_SPRING = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 32,
  mass: 0.9,
};

export const NYXON_SPRING_FAST = {
  type: 'spring' as const,
  stiffness: 460,
  damping: 34,
};

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
  onClick?: () => void;
}

/**
 * Motion Primitives-inspired cursor-tracking Spotlight surface.
 * Automatically ignores touch/coarse pointers so mobile taps never leave sticky glows.
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(255, 255, 255, 0.11)',
  onClick,
}: SpotlightCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  const handlePointerLeave = () => {
    if (coords.visible) {
      setCoords((prev) => ({ ...prev, visible: false }));
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Radial Cursor Spotlight Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-200"
        style={{
          opacity: coords.visible ? 1 : 0,
          background: `radial-gradient(240px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 72%)`,
        }}
      />
      {/* Top-edge specular hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-70"
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

interface ProgressiveBlurProps {
  direction: 'top' | 'bottom';
  className?: string;
}

/**
 * Motion Primitives-style layered Progressive Blur gradient mask so scrolled content
 * melts smoothly behind headers and the floating player bar without harsh seams.
 */
export function ProgressiveBlur({ direction, className = '' }: ProgressiveBlurProps) {
  const isTop = direction === 'top';
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none sticky left-0 right-0 z-20 ${
        isTop ? 'top-0 -mb-10 h-10' : 'bottom-0 -mt-12 h-12'
      } ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          maskImage: isTop
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 45%, transparent 82%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 45%, transparent 82%)',
          WebkitMaskImage: isTop
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 45%, transparent 82%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 45%, transparent 82%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: isTop
            ? 'linear-gradient(to bottom, rgba(5,5,8,0.68) 0%, rgba(5,5,8,0.18) 50%, transparent 100%)'
            : 'linear-gradient(to top, rgba(5,5,8,0.78) 0%, rgba(5,5,8,0.22) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}

interface AnimatedTabIndicatorProps {
  layoutId: string;
  className?: string;
}

export function AnimatedTabIndicator({
  layoutId,
  className = 'bg-white shadow-sm rounded-lg',
}: AnimatedTabIndicatorProps) {
  return (
    <motion.span
      layoutId={layoutId}
      transition={NYXON_SPRING}
      className={`absolute inset-0 ${className}`}
      aria-hidden="true"
    />
  );
}
