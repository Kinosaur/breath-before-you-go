"use client";

import { useState } from "react";

interface Props {
  cityName: string;
  country:  string;
  pm25:     number;
  bestMonth: string;
  worstMonth: string;
  cityId:   string;
}

export function CityShareButton({ cityName, country, pm25, bestMonth, worstMonth, cityId }: Props) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/cities/${cityId}`
    : `/cities/${cityId}`;
  const shareText = `${cityName}, ${country}: PM2.5 median ${pm25} µg/m³. Best month: ${bestMonth} · Worst: ${worstMonth}. Seasonal air quality calendar →`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${cityName} Air Quality — Breathe Before You Go`,
          text:  shareText,
          url:   shareUrl,
        });
      } catch {
        // user cancelled or share failed — do nothing
      }
      return;
    }

    // Desktop fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-surface-3 bg-surface-2/90 text-[11px] font-mono text-ink-muted transition-all hover:border-ink-faint/60 hover:text-ink"
      aria-label={`Share ${cityName} air quality page`}
    >
      {state === "copied" ? (
        <>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 1 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M11.5 2.5a2.5 2.5 0 1 1 0 5 2.47 2.47 0 0 1-1.558-.548L5.75 9.51a2.493 2.493 0 0 1 0 .98l4.192 2.557A2.5 2.5 0 1 1 9.5 14a2.493 2.493 0 0 1 .308-1.193L5.616 10.25A2.5 2.5 0 1 1 4.5 5.5c.594 0 1.137.208 1.558.548l4.192-2.558A2.493 2.493 0 0 1 9.5 2.5h2zm0 10a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-7-5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm7-5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
          </svg>
          Share
        </>
      )}
    </button>
  );
}
