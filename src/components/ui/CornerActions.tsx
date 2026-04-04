"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface Props {
  githubHref?: string;
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.54 2.87 8.4 6.84 9.77.5.1.68-.22.68-.48v-1.7c-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.1-1.49-1.1-1.49-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.88 1.55 2.31 1.1 2.87.84.09-.65.35-1.1.63-1.36-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.04 1.04-2.76-.1-.26-.45-1.3.1-2.7 0 0 .85-.28 2.8 1.05.81-.23 1.68-.35 2.55-.36.86.01 1.74.13 2.55.36 1.95-1.33 2.8-1.05 2.8-1.05.55 1.4.2 2.44.1 2.7.65.72 1.04 1.64 1.04 2.76 0 3.95-2.35 4.82-4.58 5.07.36.32.69.96.69 1.93v2.86c0 .26.18.58.69.48A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

export function CornerActions({ githubHref = "https://github.com/Kinosaur/breath-before-you-go" }: Props) {
  const pathname = usePathname();
  const [hideMethodology, setHideMethodology] = useState(false);
  const isMethodologyPage = pathname.startsWith("/about");

  useEffect(() => {
    if (pathname !== "/") {
      setHideMethodology(false);
      return;
    }

    const target = document.getElementById("city-grid");
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHideMethodology(entry.isIntersecting && entry.intersectionRatio > 0.25);
      },
      { threshold: [0, 0.25, 0.5] },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div className="fixed right-6 top-6 z-40 flex items-center gap-2.5 sm:right-7 sm:top-6 sm:gap-4 text-xs font-mono backdrop-blur-sm">
      {!isMethodologyPage && (
        <Link
          href="/about"
          className={`link-underline-reveal inline-flex rounded-full border border-surface-3 bg-surface-2/90 px-2.5 py-1 text-[11px] text-ink-muted transition-all duration-300 hover:border-ink-faint/60 hover:text-ink sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-xs ${hideMethodology ? "pointer-events-none translate-y-1 opacity-0" : "pointer-events-auto translate-y-0 opacity-100"}`}
          aria-label="Open methodology page"
        >
          Methodology
        </Link>
      )}
      <a
        href={githubHref}
        target="_blank"
        rel="noreferrer"
        className="link-underline-reveal inline-flex items-center gap-1 rounded-full border border-surface-3 bg-surface-2/90 px-2.5 py-1 text-[11px] text-ink-muted transition-all duration-300 hover:border-ink-faint/60 hover:text-ink sm:gap-1.5 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:text-xs"
        aria-label="Open GitHub repository"
        title="GitHub repository"
      >
        <GitHubIcon />
        <span>GitHub</span>
      </a>
    </div>
  );
}