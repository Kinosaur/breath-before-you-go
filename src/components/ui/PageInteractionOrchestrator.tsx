"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function supportsMotion() {
  if (typeof window === "undefined") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PageInteractionOrchestrator() {
  const pathname = usePathname();

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    const raf = window.requestAnimationFrame(() => {
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
      if (nodes.length === 0) return;

      for (const node of nodes) node.classList.remove("is-visible");

      if (!supportsMotion()) {
        for (const node of nodes) node.classList.add("is-visible");
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            el.classList.add("is-visible");
            observer?.unobserve(el);
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );

      for (const node of nodes) observer.observe(node);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
