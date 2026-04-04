"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  fallback: React.ReactNode;
  rootMargin?: string;
}

export function DeferredRender({
  children,
  fallback,
  rootMargin = "320px 0px",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        setIsActive(true);
        observer.disconnect();
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return <div ref={containerRef}>{isActive ? children : fallback}</div>;
}
