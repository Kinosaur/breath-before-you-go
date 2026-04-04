"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function HeavyBlockCoordinator() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/cities/")) return;

    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-heavy-block]"));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const node = entry.target as HTMLElement;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            node.classList.add("is-heavy-visible");
          } else {
            node.classList.remove("is-heavy-visible");
          }
        }
      },
      { threshold: [0.15, 0.3, 0.6], rootMargin: "-8% 0px -18% 0px" },
    );

    for (const node of nodes) observer.observe(node);

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
