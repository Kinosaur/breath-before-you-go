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
      className="inline-flex items-center gap-2 rounded-full border border-surface-3 px-2.5 py-1 text-xs font-mono text-ink-muted"
      aria-live="polite"
      title="Current audience framing"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" aria-hidden="true" />
      <span className="text-ink">{modeToLabel(normalizedMode)}</span>
      <span className="text-ink-faint">{modeToHint(normalizedMode)}</span>
    </div>
  );
}
