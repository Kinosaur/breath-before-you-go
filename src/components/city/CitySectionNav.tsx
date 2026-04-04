"use client";

import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
};

interface Props {
  items: NavItem[];
}

export function CitySectionNav({ items }: Props) {
  const sectionIds = useMemo(() => items.map((item) => item.href.replace("#", "")), [items]);
  const [activeId, setActiveId] = useState(sectionIds[0] ?? "");

  useEffect(() => {
    const currentHash = window.location.hash.replace("#", "");
    if (currentHash && sectionIds.includes(currentHash)) {
      setActiveId(currentHash);
    }

    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && sectionIds.includes(hash)) setActiveId(hash);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-24% 0px -62% 0px", threshold: [0.15, 0.35, 0.65] },
    );

    for (const id of sectionIds) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }

    window.addEventListener("hashchange", onHashChange, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [sectionIds]);

  return (
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="City page sections">
      {items.map(({ href, label }) => {
        const id = href.replace("#", "");
        const isActive = id === activeId;

        return (
          <a
            key={href}
            href={href}
            aria-label={`Jump to ${label} section`}
            aria-current={isActive ? "location" : undefined}
            className={[
              "control-chip text-[11px] font-mono focus-visible:ring-2 focus-visible:ring-accent-clean focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
              isActive ? "control-chip-active" : "",
            ].join(" ")}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
