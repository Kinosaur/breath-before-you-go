"use client";

import { useEffect, useState } from "react";

interface Props {
  sectionIds: string[];
}

export function CityReadingProgress({ sectionIds }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const ids = sectionIds.filter(Boolean);
    if (ids.length === 0) return;

    const onScroll = () => {
      const first = document.getElementById(ids[0]);
      const last = document.getElementById(ids[ids.length - 1]);
      if (!first || !last) return;

      const viewportTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const viewportBottom = viewportTop + viewportHeight;
      const maxScrollable = Math.max(docHeight - viewportHeight, 1);
      const remaining = maxScrollable - viewportTop;
      const endThreshold = Math.max(8, maxScrollable * 0.0035);

      // Force completion near true page bottom to avoid fractional px misses.
      if (viewportBottom >= docHeight - 2 || remaining <= endThreshold) {
        setProgress(1);
        return;
      }

      const start = first.offsetTop - viewportHeight * 0.2;
      const sectionEnd = last.offsetTop + last.offsetHeight - viewportHeight * 0.45;
      const pageEnd = docHeight - viewportHeight;
      const end = Math.max(sectionEnd, pageEnd);
      const span = Math.max(end - start, 1);
      const raw = (viewportTop - start) / span;
      const next = Math.max(0, Math.min(1, raw));
      setProgress(next);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sectionIds]);

  return (
    <div className="fixed inset-x-0 top-0 z-[55] h-[2px] bg-transparent pointer-events-none" aria-hidden="true">
      <div
        className="h-full transition-[width] duration-150 ease-out"
        style={{
          width: `${(progress * 100).toFixed(2)}%`,
          background:
            "linear-gradient(90deg, var(--aqi-good) 0%, var(--aqi-good) 18%, var(--aqi-moderate) 34%, var(--aqi-sensitive) 52%, var(--aqi-unhealthy) 74%, var(--aqi-hazardous) 100%)",
        }}
      />
    </div>
  );
}
