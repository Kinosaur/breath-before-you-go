/**
 * Landing page — Server Component (statically rendered)
 *
 * Assembles:
 *   1. Hero with tagline + Data Freshness badge
 *   2. Dual entry point cards (Plan a Trip / My City)
 *   3. Asia Breathing Map (client, lazy-loaded)
 *   4. City grid (15 cities)
 *   5. Footer with attribution
 *
 * Data is read from disk at build/request time (getIndex uses fs.readFileSync).
 * No network calls from the server — all data is pre-computed static JSON.
 *
 * ModeBadge reads ?mode= client-side via useSearchParams() so this route
 * stays statically rendered (○) — no searchParams prop needed here.
 */

import { Suspense } from "react";
import { getIndex } from "@/lib/data";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { EntryPointCards }    from "@/components/ui/EntryPointCards";
import { CityGrid }           from "@/components/ui/CityGrid";
import { AsiaBreathingMapClient } from "@/components/map/AsiaBreathingMapClient";
import { ModeBadge } from "@/components/ui/ModeBadge";
import { DeferredRender } from "@/components/ui/DeferredRender";

export default function HomePage() {
  const index = getIndex();

  return (
    <main className="min-h-screen bg-[#0a0a0a]">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="px-5 pt-16 pb-10 max-w-5xl mx-auto" data-reveal style={{ "--reveal-delay": "40ms" } as React.CSSProperties}>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <DataFreshnessBadge
            generatedAt={index.generated}
          />
          {/* Suspense required: useSearchParams() suspends until query string is known */}
          <Suspense fallback={null}>
            <ModeBadge />
          </Suspense>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-ink leading-tight mb-3">
          Breathe Before You Go
        </h1>

        <p className="text-xl text-ink-muted mb-3">
          When and where is it safe to breathe?
        </p>

        <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
          Five years of air quality data across {index.cityCount} Asian cities —
          translated into decisions you can act on.
          Best month to visit. Safe hours to exercise outside.
          Health costs in terms anyone can understand.
        </p>
      </section>

      {/* ── Dual entry points ────────────────────────────────────────────── */}
      <section className="px-5 pb-10 max-w-5xl mx-auto" data-reveal style={{ "--reveal-delay": "80ms" } as React.CSSProperties}>
        <EntryPointCards />
      </section>

      {/* ── Asia Breathing Map ───────────────────────────────────────────── */}
      <section id="map" className="px-5 pb-14 max-w-5xl mx-auto" data-reveal style={{ "--reveal-delay": "120ms" } as React.CSSProperties}>
        <div className="flex items-baseline gap-3 mb-5">
          <h2 className="text-xl font-semibold text-ink">
            Asia Breathing Map
          </h2>
          <span className="text-sm text-ink-muted hidden sm:inline">
            — drag the month slider to change marker colors
          </span>
        </div>

        <DeferredRender
          fallback={
            <div
              className="w-full rounded-xl bg-surface-2 flex items-center justify-center border border-surface-3"
              style={{ height: "clamp(320px, 62vh, 500px)" }}
              aria-live="polite"
            >
              <span className="text-sm text-ink-muted">Preparing map…</span>
            </div>
          }
        >
          <AsiaBreathingMapClient cities={index.cities} />
        </DeferredRender>
      </section>

      {/* ── City grid ────────────────────────────────────────────────────── */}
      <section id="city-grid" className="px-5 pb-16 max-w-5xl mx-auto" data-reveal style={{ "--reveal-delay": "80ms" } as React.CSSProperties}>
        <CityGrid cities={index.cities} />
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-3 px-5 py-8 max-w-5xl mx-auto" data-reveal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3
                        text-[11px] text-ink-muted font-mono">
          <div className="space-y-1">
            <div>
              Data:{" "}
              <a
                href="https://openaq.org"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-ink"
              >
                OpenAQ API v3
              </a>
              {" · "}
              <a
                href="https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-ink"
              >
                WHO 2021 AQI Guidelines
              </a>
              {" · "}
              <a
                href="https://berkeleyearth.org/air-quality-real-time-map/"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-ink"
              >
                Berkeley Earth Cig. Equivalence
              </a>
            </div>
            <div>
              Cigarette equivalence is a statistical communication tool —
              not a clinical diagnosis.{" "}
              <a href="/about" className="underline hover:text-ink">
                Methodology →
              </a>
            </div>
          </div>
          <div className="text-right">
            <div>Built by Kino · Summer 2026</div>
            <div className="text-ink-muted/80 mt-0.5">
              {index.cityCount} cities · 5 years of data
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}
