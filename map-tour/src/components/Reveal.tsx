import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Stagger position within a group. Each step adds 70ms, capped at 6 steps
   *  so a long list never leaves the reader waiting on the last item. */
  index?: number;
  /** Fraction of the element that must be on screen before it reveals. */
  amount?: number;
  as?: ElementType;
  className?: string;
}

const STEP_MS = 70;
const MAX_STEPS = 6;

/**
 * Reveals its children once, when they scroll into view.
 *
 * Uses IntersectionObserver rather than a scroll handler so nothing runs on
 * the scroll frame, and unobserves on first intersection so the callback stops
 * firing for content the reader has already passed. All easing lives in
 * `.u-reveal`, which collapses to a no-op under `prefers-reduced-motion`.
 */
export function Reveal({ children, index = 0, amount = 0.15, as, className }: RevealProps) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Older Safari and any non-browser render path: show the content rather
    // than leaving it permanently transparent.
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: amount, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [amount]);

  const delay = Math.min(index, MAX_STEPS) * STEP_MS;

  return (
    <Tag
      ref={ref}
      className={className ? `u-reveal ${className}` : 'u-reveal'}
      data-visible={isVisible}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
