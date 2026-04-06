import { useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { cn } from './utils';

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  glareClassName?: string;
  style?: CSSProperties;
  disabled?: boolean;
  maxTilt?: number;
  scale?: number;
};

export function TiltCard({
  children,
  className,
  contentClassName,
  glareClassName,
  style,
  disabled = false,
  maxTilt = 12,
  scale = 1.018,
}: TiltCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotionRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef<{ px: number; py: number } | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncReducedMotion = () => {
      reduceMotionRef.current = mediaQuery.matches;
      if (mediaQuery.matches) {
        resetTilt();
      }
    };

    syncReducedMotion();
    mediaQuery.addEventListener('change', syncReducedMotion);
    return () => mediaQuery.removeEventListener('change', syncReducedMotion);
  }, []);

  useEffect(() => {
    if (disabled) {
      resetTilt();
    }
  }, [disabled]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const resetTilt = () => {
    const node = rootRef.current;
    if (!node) return;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    pointerRef.current = null;
    node.dataset.tiltActive = 'false';
    node.style.setProperty('--tilt-rotate-x', '0deg');
    node.style.setProperty('--tilt-rotate-y', '0deg');
    node.style.setProperty('--tilt-glare-x', '50%');
    node.style.setProperty('--tilt-glare-y', '50%');
    node.style.setProperty('--tilt-glare-opacity', '0');
    node.style.setProperty('--tilt-scale', '1');
  };

  const flushTiltFrame = () => {
    frameRef.current = null;
    const node = rootRef.current;
    const pointer = pointerRef.current;
    if (!node || !pointer) return;

    const rotateY = (pointer.px - 0.5) * maxTilt * 2;
    const rotateX = (0.5 - pointer.py) * maxTilt * 2;

    node.dataset.tiltActive = 'true';
    node.style.setProperty('--tilt-rotate-x', `${rotateX.toFixed(2)}deg`);
    node.style.setProperty('--tilt-rotate-y', `${rotateY.toFixed(2)}deg`);
    node.style.setProperty('--tilt-glare-x', `${(pointer.px * 100).toFixed(2)}%`);
    node.style.setProperty('--tilt-glare-y', `${(pointer.py * 100).toFixed(2)}%`);
    node.style.setProperty('--tilt-glare-opacity', '0.82');
    node.style.setProperty('--tilt-scale', scale.toString());
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || reduceMotionRef.current || event.pointerType === 'touch') {
      return;
    }

    const node = rootRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    pointerRef.current = { px, py };

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(flushTiltFrame);
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn('tilt-card', className)}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
      data-tilt-active="false"
    >
      <div className={cn('tilt-card__content', contentClassName)}>{children}</div>
      <div className={cn('tilt-card__glare', glareClassName)} aria-hidden="true" />
    </div>
  );
}
