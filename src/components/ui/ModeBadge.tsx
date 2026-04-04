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
    <div className="group inline-flex flex-col items-start" aria-live="polite">
      <div
        className="inline-flex items-center gap-2 rounded-full border border-surface-3 px-2.5 py-1 text-xs font-mono text-ink-muted
                   transition-colors duration-150 hover:border-ink-faint/60"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" aria-hidden="true" />
        <span className="text-ink">{modeToLabel(normalizedMode)}</span>
        <span className="text-ink-faint">{modeToHint(normalizedMode)}</span>
      </div>

      <span
        className="mt-1 max-h-0 overflow-hidden rounded-md border border-transparent px-2 py-0
                   text-[10px] leading-relaxed text-ink-muted opacity-0 transition-all duration-200 ease-out
                   group-hover:max-h-16 group-hover:border-surface-3 group-hover:bg-surface group-hover:py-1 group-hover:opacity-100
                   group-focus-within:max-h-16 group-focus-within:border-surface-3 group-focus-within:bg-surface group-focus-within:py-1 group-focus-within:opacity-100"
      >
        Current audience framing
      </span>
    </div>
  );
}
