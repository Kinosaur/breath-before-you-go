/**
 * Landing page — Server Component (statically rendered)
 *
 * Structure:
 *   1. Hero — headline, one-line description, inline caveat
 *   2. Asia Breathing Map
 *   3. City grid (15 cities)
 *   4. Footer with attribution
 */

import { Suspense } from "react";
import { getIndex } from "@/lib/data";
import { DataFreshnessBadge } from "@/components/ui/DataFreshnessBadge";
import { CityGrid }           from "@/components/ui/CityGrid";
import { AsiaBreathingMapClient } from "@/components/map/AsiaBreathingMapClient";
import { ModeBadge } from "@/components/ui/ModeBadge";

export default function HomePage() {
  const index = getIndex();

  return (
    <main className="min-h-screen bg-[#080B12]">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="px-5 pt-16 pb-10 max-w-5xl mx-auto">

        <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-ink leading-tight mb-3">
          Breathe Before You Go
        </h1>

        <p className="text-xl text-ink-muted mb-4 max-w-2xl">
          When is it safe to breathe? Seasonal air quality for {index.cityCount} Asian cities — pick one to explore.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <DataFreshnessBadge generatedAt={index.generated} />
          {/* Suspense required: useSearchParams() suspends until query string is known */}
          <Suspense fallback={null}>
            <ModeBadge />
          </Suspense>
          <span className="text-xs text-ink-muted font-mono">
            Seasonal data —{" "}
            <a
              href="https://www.iqair.com"
              target="_blank"
              rel="noreferrer"
              className="link-underline-reveal hover:text-ink transition-colors"
            >
              IQAir ↗
            </a>
            {" "}for today&apos;s readings ·{" "}
            <a href="/about" className="link-underline-reveal hover:text-ink transition-colors">
              Methodology ↗
            </a>
          </span>
        </div>

      </section>

      {/* ── Asia Breathing Map ───────────────────────────────────────────── */}
      <section id="map" className="px-5 pb-14 max-w-5xl mx-auto">
        <div className="flex items-baseline gap-3 mb-5">
          <h2 className="font-editorial text-2xl font-semibold text-ink">
            Asia Breathing Map
          </h2>
          <span className="text-sm text-ink-muted hidden sm:inline">
            — drag the month slider to change marker colors
          </span>
        </div>

        <AsiaBreathingMapClient cities={index.cities} />
      </section>

      {/* ── City grid ────────────────────────────────────────────────────── */}
      <section id="city-grid" className="px-5 pb-16 max-w-5xl mx-auto">
        <CityGrid cities={index.cities} />
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-3 px-5 py-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3
                        text-[11px] text-ink-muted font-mono">
          <div className="space-y-1">
            <div>
              Data:{" "}
              <a
                href="https://openaq.org"
                target="_blank"
                rel="noreferrer"
                className="link-underline-reveal transition-colors hover:text-ink"
              >
                OpenAQ API v3
              </a>
              {" · "}
              <a
                href="https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health"
                target="_blank"
                rel="noreferrer"
                className="link-underline-reveal transition-colors hover:text-ink"
              >
                WHO 2021 AQI Guidelines
              </a>
              {" · "}
              <a
                href="https://berkeleyearth.org/air-quality-real-time-map/"
                target="_blank"
                rel="noreferrer"
                className="link-underline-reveal transition-colors hover:text-ink"
              >
                Berkeley Earth Cig. Equivalence
              </a>
            </div>
            <div>
              Cigarette equivalence is a statistical communication tool —
              not a clinical diagnosis.{" "}
              <a href="/about" className="link-underline-reveal transition-colors hover:text-ink">
                Methodology →
              </a>
            </div>
          </div>
          <div className="text-right">
            <div>Built by Kino · Summer 2026</div>
            <div className="text-ink-muted/80 mt-0.5">
              {index.cityCount} cities · years of seasonal data
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}
