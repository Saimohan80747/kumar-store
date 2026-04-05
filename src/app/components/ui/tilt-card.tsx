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

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const resetTilt = () => {
    const node = rootRef.current;
    if (!node) return;

    node.dataset.tiltActive = 'false';
    node.style.setProperty('--tilt-rotate-x', '0deg');
    node.style.setProperty('--tilt-rotate-y', '0deg');
    node.style.setProperty('--tilt-glare-x', '50%');
    node.style.setProperty('--tilt-glare-y', '50%');
    node.style.setProperty('--tilt-glare-opacity', '0');
    node.style.setProperty('--tilt-scale', '1');
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
    const rotateY = (px - 0.5) * maxTilt * 2;
    const rotateX = (0.5 - py) * maxTilt * 2;

    node.dataset.tiltActive = 'true';
    node.style.setProperty('--tilt-rotate-x', `${rotateX.toFixed(2)}deg`);
    node.style.setProperty('--tilt-rotate-y', `${rotateY.toFixed(2)}deg`);
    node.style.setProperty('--tilt-glare-x', `${(px * 100).toFixed(2)}%`);
    node.style.setProperty('--tilt-glare-y', `${(py * 100).toFixed(2)}%`);
    node.style.setProperty('--tilt-glare-opacity', '0.88');
    node.style.setProperty('--tilt-scale', scale.toString());
  };

  return (
    <div
      ref={rootRef}
      className={cn('tilt-card', className)}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerCancel={resetTilt}
      data-tilt-active="false"
    >
      <div className={cn('tilt-card__content', contentClassName)}>{children}</div>
      <div className={cn('tilt-card__glare', glareClassName)} aria-hidden="true" />
    </div>
  );
}
