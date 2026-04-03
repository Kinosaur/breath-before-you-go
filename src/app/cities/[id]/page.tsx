/**
 * City detail page — /cities/[id]
 *
 * Weeks 4–5 deliverable. Sections (in order):
 *   Hero     — city name, country, data freshness badge, section nav
 *   #health  — Health Metrics Panel (server component)
 *   #clock   — Lung Clock: D3 radial chart, 24h activity selector (Week 5)
 *   #life    — Life Expectancy Toll chart with peer/equity toggle (Week 5)
 *   #calendar — Breathing Calendar: D3 12×31 heatmap
 *   #exposure — Cigarette Counter + Trip Calculator
 *   #story   — Scrollytelling prototype: 2 sections (Week 5)
 *   #events  — Seasonal risk events (if any)
 *
 * Data:
 *   profile.json        → getCityProfile()
 *   seasonal-heatmap.json → getSeasonalHeatmap()
 *   hourly-latest.json  → getHourlyLatest()
 *   index.json          → getIndex()  (peer cities for LifeExpectancyChart)
 */

import { notFound }                      from "next/navigation";
import Link                              from "next/link";
import {
  getCityProfile,
  getSeasonalHeatmap,
  getHourlyLatest,
  getIndex,
}                                        from "@/lib/data";
import { DataFreshnessBadge }            from "@/components/ui/DataFreshnessBadge";
import { HealthMetricsPanel }            from "@/components/city/HealthMetricsPanel";
import { BreathingCalendar }             from "@/components/city/BreathingCalendar";
import { CigaretteCounter }              from "@/components/city/CigaretteCounter";
import { LungClock }                     from "@/components/city/LungClock";
import { LifeExpectancyChart }           from "@/components/city/LifeExpectancyChart";
import { ScrollyTelling }                from "@/components/city/ScrollyTelling";
import { classifyBand, getBandColor }    from "@/lib/constants";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const { getIndex: gi } = await import("@/lib/data");
  return gi().cities.map((city) => ({ id: city.id }));
}

export default async function CityPage({ params }: Props) {
  const { id } = await params;

  let profile, heatmap, hourly, index;
  try {
    profile = getCityProfile(id);
    heatmap = getSeasonalHeatmap(id);
    index   = getIndex();
    // hourly data may be unavailable for some cities (Jakarta sensors offline)
    try { hourly = getHourlyLatest(id); } catch { hourly = null; }
  } catch {
    notFound();
  }

  const pm25Color = getBandColor(classifyBand(profile.healthMetrics.annualMedianPm25));

  // Build peer city list for LifeExpectancyChart
  const peerCities = index.cities.map((c) => ({
    name:      c.name,
    id:        c.id,
    yearsLost: c.yearsLost,
    isCurrent: c.id === id,
  }));

  const hasHourly = hourly?.available && (hourly?.typicalDay?.length ?? 0) === 24;

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-5">

        {/* ── Back nav ──────────────────────────────────────────────────── */}
        <div className="pt-8 pb-4">
          <Link
            href="/"
            className="text-xs text-ink-muted font-mono hover:text-ink transition-colors"
          >
            ← All cities
          </Link>
        </div>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="pb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <DataFreshnessBadge generatedAt={profile.dataQuality.lastComputed} />
          </div>

          <div className="flex items-start gap-4">
            <div
              className="hidden sm:block w-1 self-stretch rounded-full flex-shrink-0"
              style={{ background: pm25Color }}
              aria-hidden="true"
            />
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-ink leading-tight">
                {profile.cityName}
              </h1>
              <p className="text-lg text-ink-muted mt-1">
                {profile.country} · Tier {profile.tier}
              </p>
              <p className="text-sm text-ink-muted mt-2 font-mono">
                {profile.dataQuality.totalDays.toLocaleString()} days of data ·{" "}
                {profile.dataQuality.yearsAvailable[0]}–
                {profile.dataQuality.yearsAvailable[profile.dataQuality.yearsAvailable.length - 1]} ·{" "}
                {profile.dataQuality.sensors} sensor{profile.dataQuality.sensors !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <nav className="mt-6 flex flex-wrap gap-2" aria-label="City page sections">
            {[
              { href: "#health",   label: "Health" },
              { href: "#clock",    label: "Lung Clock",     show: hasHourly },
              { href: "#life",     label: "Life impact" },
              { href: "#calendar", label: "Calendar" },
              { href: "#exposure", label: "Exposure" },
              { href: "#story",    label: "Story" },
              { href: "#events",   label: "Seasonal events", show: profile.seasonalEvents.length > 0 },
            ]
              .filter((item) => item.show !== false)
              .map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-surface-2
                             border border-surface-3 text-ink-muted hover:text-ink hover:bg-surface-3
                             transition-colors"
                >
                  {label}
                </a>
              ))}
          </nav>
        </section>

        {/* ── Health Metrics ─────────────────────────────────────────────── */}
        <section id="health" className="pb-12 scroll-mt-6">
          <h2 className="text-lg font-semibold text-ink mb-5">Health impact</h2>
          <HealthMetricsPanel profile={profile} />
        </section>

        {/* ── Lung Clock ─────────────────────────────────────────────────── */}
        {hasHourly && (
          <section id="clock" className="pb-12 scroll-mt-6">
            <h2 className="text-lg font-semibold text-ink mb-2">Lung clock</h2>
            <p className="text-sm text-ink-muted mb-5">
              24-hour air quality pattern. Dimmed arcs are unsafe for the selected activity.
            </p>
            <div className="rounded-xl bg-surface-2 border border-surface-3 p-5">
              <LungClock
                typicalDay={hourly!.typicalDay}
                lat={profile.coordinates.lat}
                cityName={profile.cityName}
              />
            </div>
          </section>
        )}

        {/* ── Life Expectancy Chart ──────────────────────────────────────── */}
        <section id="life" className="pb-12 scroll-mt-6">
          <h2 className="text-lg font-semibold text-ink mb-2">Life expectancy toll</h2>
          <p className="text-sm text-ink-muted mb-5">
            How does the air here compare to other health risks — and to peer cities?
          </p>
          <div className="rounded-xl bg-surface-2 border border-surface-3 p-5">
            <LifeExpectancyChart
              context={profile.healthMetrics.lifeExpectancyContext}
              cityName={profile.cityName}
              peerCities={peerCities}
            />
          </div>
        </section>

        {/* ── Breathing Calendar ─────────────────────────────────────────── */}
        <section id="calendar" className="pb-12 scroll-mt-6">
          <h2 className="text-lg font-semibold text-ink mb-2">Breathing calendar</h2>
          <p className="text-sm text-ink-muted mb-5">
            Every day of the year, colored by PM2.5 air quality band.
          </p>
          <div className="relative rounded-xl bg-surface-2 border border-surface-3 p-5">
            <BreathingCalendar heatmap={heatmap} />
          </div>
        </section>

        {/* ── Cigarette Counter + Trip Calc ──────────────────────────────── */}
        <section id="exposure" className="pb-12 scroll-mt-6">
          <h2 className="text-lg font-semibold text-ink mb-5">Exposure calculator</h2>
          <CigaretteCounter profile={profile} />
        </section>

        {/* ── Scrollytelling ─────────────────────────────────────────────── */}
        <section id="story" className="pb-12 scroll-mt-6">
          <h2 className="text-lg font-semibold text-ink mb-2">The story</h2>
          <p className="text-sm text-ink-muted mb-6">
            Scroll through to see the numbers come alive.
          </p>
          <div className="rounded-xl bg-surface-2 border border-surface-3 overflow-hidden">
            <ScrollyTelling profile={profile} />
          </div>
        </section>

        {/* ── Seasonal events ────────────────────────────────────────────── */}
        {profile.seasonalEvents.length > 0 && (
          <section id="events" className="pb-12 scroll-mt-6">
            <h2 className="text-lg font-semibold text-ink mb-5">Seasonal risk events</h2>
            <div className="space-y-3">
              {profile.seasonalEvents.map((ev, i) => {
                const riskColor =
                  ev.risk_level === "high"   ? "#F44336" :
                  ev.risk_level === "medium" ? "#FF9800" : "#FFEB3B";
                return (
                  <div key={i} className="flex gap-4 rounded-xl bg-surface-2 border border-surface-3 p-4">
                    <div
                      className="w-1 rounded-full flex-shrink-0"
                      style={{ background: riskColor }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-ink">{ev.event}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                          style={{ background: riskColor, color: ev.risk_level === "high" ? "#fff" : "#000" }}
                        >
                          {ev.risk_level}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted">{ev.cause}</p>
                      <p className="text-[10px] text-ink-muted mt-1 font-mono">
                        Affects:{" "}
                        {ev.months
                          .map((m) => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1])
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="border-t border-surface-3 py-8 text-[11px] text-ink-muted font-mono">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div>
              Data: OpenAQ API v3 · WHO 2021 AQI Guidelines · Berkeley Earth ·{" "}
              <a href="/about" className="underline hover:text-ink">Methodology →</a>
            </div>
            <div>
              <Link href="/" className="underline hover:text-ink">← Back to overview</Link>
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}
