"use client";

/**
 * ScrollySection — generic Intersection Observer wrapper
 *
 * When the section enters the viewport (threshold=0.35 by default),
 * it sets `isVisible=true` and calls `onEnter()`.
 * On exit it calls `onLeave()` and resets to allow re-triggering on
 * the next scroll past.
 *
 * Children receive the `isVisible` flag via render prop so they can
 * drive their own CSS transitions / D3 animations.
 */

import { useEffect, useRef, useState } from "react";

interface Props {
  children:   (isVisible: boolean) => React.ReactNode;
  threshold?: number;         // 0–1, default 0.35
  once?:      boolean;        // if true, stays visible after first trigger
  className?: string;
}

export function ScrollySection({
  children,
  threshold = 0.35,
  once      = true,
  className = "",
}: Props) {
  const ref          = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold, once]);

  return (
    <div ref={ref} className={className}>
      {children(isVisible)}
    </div>
  );
}
