"use client";

/**
 * ModeBadge — Client Component
 *
 * Reads `?mode=travel|resident` from the URL on the client so the parent
 * page stays a static Server Component (no searchParams prop required).
 *
 * Wrap with <Suspense> in the parent to avoid a hydration boundary flash.
 */

import { useSearchParams } from "next/navigation";

type Mode = "travel" | "resident";

function modeToLabel(mode: Mode): string {
  return mode === "travel" ? "Travel Mode" : "Resident Mode";
}

function modeToHint(mode: Mode): string {
  return mode === "travel"
    ? "Calendar-first framing"
    : "Real-time-first framing";
}

export function ModeBadge() {
  const searchParams    = useSearchParams();
  const raw             = searchParams.get("mode");
  const normalizedMode: Mode = raw === "resident" ? "resident" : "travel";

  return (
    <div
      className="group relative inline-flex items-center gap-2 rounded-full border border-surface-3 px-2.5 py-1 text-xs font-mono text-ink-muted
                 transition-colors duration-150 hover:border-ink-faint/60"
      aria-live="polite"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" aria-hidden="true" />
      <span className="text-ink">{modeToLabel(normalizedMode)}</span>
      <span className="text-ink-faint">{modeToHint(normalizedMode)}</span>

      <span
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 max-w-[200px] whitespace-normal text-center
                   rounded-md border border-surface-3 bg-surface px-2 py-1 text-[10px] leading-relaxed text-ink-muted shadow-lg
                   opacity-0 -translate-y-1 transition-all duration-200 ease-out group-hover:opacity-100 group-hover:translate-y-0"
      >
        Current audience framing
      </span>
    </div>
  );
}
