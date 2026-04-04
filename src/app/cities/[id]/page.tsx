/**
 * City detail page — /cities/[id]
 *
 * Weeks 4–8 deliverable. Sections (in order):
 *   Hero     — city name, country, data freshness badge, section nav
 *   #health  — Health Metrics Panel (server component)
 *   #clock   — Lung Clock: D3 radial chart, 24h activity selector
 *   #life    — Life Expectancy Toll chart with peer/equity toggle
 *   #calendar — Breathing Calendar: D3 12×31 heatmap
 *   #exposure — Cigarette Counter + Trip Calculator
 *   #story   — Scrollytelling (Tier 1 only, data-driven via scrollyContent)
 *   #summary — City profile narrative (Tier 2 only)
 *   #events  — Seasonal risk events (if any)
 *
 *
 * Data:
 *   profile.json        → getCityProfile()
 *   seasonal-heatmap.json → getSeasonalHeatmap()
 *   hourly-latest.json  → getHourlyLatest()
 *   index.json          → getIndex()  (peer cities for LifeExpectancyChart)
 */

import { notFound }                      from "next/navigation";
import Link                              from "next/link";
import dynamic                           from "next/dynamic";
import {
  getCityProfile,
  getSeasonalHeatmap,
  getHourlyLatest,
  getIndex,
}                                        from "@/lib/data";
import { DataFreshnessBadge }            from "@/components/ui/DataFreshnessBadge";
import { HealthMetricsPanel }            from "@/components/city/HealthMetricsPanel";
import { classifyBand, getBandColor }    from "@/lib/constants";
import { CitySectionNav } from "@/components/city/CitySectionNav";
import { CityReadingProgress } from "@/components/city/CityReadingProgress";
import { HeavyBlockCoordinator } from "@/components/city/HeavyBlockCoordinator";

interface Props {
  params: Promise<{ id: string }>;
}

function formatHourLabel(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

function findLongestSafeWalkWindow(
  hourlyEntries: Array<{ hour: number; safeForWalk: boolean }> | null | undefined,
): { label: string; durationHours: number } | null {
  if (!hourlyEntries || hourlyEntries.length === 0) return null;

  const sorted = [...hourlyEntries].sort((a, b) => a.hour - b.hour);
  let bestStart = -1;
  let bestEnd = -1;
  let curStart = -1;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    if (entry.safeForWalk) {
      if (curStart === -1) curStart = entry.hour;
      const isWindowEnd = i === sorted.length - 1 || !sorted[i + 1].safeForWalk;
      if (isWindowEnd) {
        const curEnd = entry.hour;
        const curLen = curEnd - curStart + 1;
        const bestLen = bestEnd >= bestStart && bestStart !== -1 ? bestEnd - bestStart + 1 : 0;
        if (curLen > bestLen) {
          bestStart = curStart;
          bestEnd = curEnd;
        }
        curStart = -1;
      }
    }
  }

  if (bestStart === -1 || bestEnd === -1) return null;

  const startLabel = formatHourLabel(bestStart);
  const endLabel = formatHourLabel((bestEnd + 1) % 24);
  return {
    label: `${startLabel}-${endLabel}`,
    durationHours: bestEnd - bestStart + 1,
  };
}

function ChartSkeleton({ h = "h-[260px]" }: { h?: string }) {
  return (
    <div className={`w-full ${h} rounded-lg bg-surface-3/60 border border-surface-3 animate-pulse`} aria-hidden="true" />
  );
}

const BreathingCalendar = dynamic(
  () => import("@/components/city/BreathingCalendar").then((m) => m.BreathingCalendar),
  { loading: () => <ChartSkeleton h="h-[340px]" /> },
);

const CigaretteCounter = dynamic(
  () => import("@/components/city/CigaretteCounter").then((m) => m.CigaretteCounter),
  { loading: () => <ChartSkeleton h="h-[220px]" /> },
);

const LungClock = dynamic(
  () => import("@/components/city/LungClock").then((m) => m.LungClock),
  { loading: () => <ChartSkeleton h="h-[440px]" /> },
);

const LifeExpectancyChart = dynamic(
  () => import("@/components/city/LifeExpectancyChart").then((m) => m.LifeExpectancyChart),
  { loading: () => <ChartSkeleton h="h-[320px]" /> },
);

const ScrollyTelling = dynamic(
  () => import("@/components/city/ScrollyTelling").then((m) => m.ScrollyTelling),
  { loading: () => <ChartSkeleton h="h-[520px]" /> },
);

const CitySummaryPanel = dynamic(
  () => import("@/components/city/CitySummaryPanel").then((m) => m.CitySummaryPanel),
  { loading: () => <ChartSkeleton h="h-[360px]" /> },
);

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

  const hourlyCount = hourly?.typicalDay?.length ?? 0;
  const hasHourlyAny = Boolean(hourly?.available && hourlyCount > 0);
  const hasHourlyFull = hasHourlyAny && hourlyCount === 24;
  const bestWalkWindow = hasHourlyAny
    ? findLongestSafeWalkWindow(hourly?.typicalDay ?? [])
    : null;
  const sectionIds = [
    "health",
    "clock",
    ...(profile.tier <= 2 ? ["life"] : []),
    "calendar",
    "exposure",
    ...(profile.tier === 1 ? ["story"] : []),
    ...(profile.tier === 2 ? ["summary"] : []),
    ...(profile.seasonalEvents.length > 0 ? ["events"] : []),
  ];

  return (
    <main className="reading-surface min-h-screen bg-[#080B12]">
      <CityReadingProgress sectionIds={sectionIds} />
      <HeavyBlockCoordinator />

      {/* ── Skip to main content (keyboard / screen reader) ───────────── */}
      <a
        href="#health"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50
                   focus:px-3 focus:py-2 focus:rounded focus:bg-surface-2 focus:text-ink focus:text-sm"
      >
        Skip to health data
      </a>

      <div className="max-w-5xl mx-auto px-5">

        {/* ── Back nav ──────────────────────────────────────────────────── */}
        <div className="pt-8 pb-4">
          <Link
            href="/"
            className="link-underline-reveal text-sm text-ink-muted font-mono transition-colors hover:text-ink"
            aria-label="Back to all cities"
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
              <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-ink leading-tight">
                {profile.cityName}
              </h1>
              <p className="text-lg text-ink-muted mt-1">
                {profile.country} · Tier {profile.tier}
              </p>
              <p className="text-base text-ink-muted mt-2 font-mono">
                {profile.dataQuality.totalDays.toLocaleString()} days of data ·{" "}
                {profile.dataQuality.yearsAvailable[0]}–
                {profile.dataQuality.yearsAvailable[profile.dataQuality.yearsAvailable.length - 1]} ·{" "}
                {profile.dataQuality.sensors} sensor{profile.dataQuality.sensors !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <CitySectionNav
            items={[
              { href: "#health", label: "Health" },
              { href: "#clock", label: "Lung Clock" },
              ...(profile.tier <= 2 ? [{ href: "#life", label: "Life impact" }] : []),
              { href: "#calendar", label: "Calendar" },
              { href: "#exposure", label: "Exposure" },
              ...(profile.tier === 1 ? [{ href: "#story", label: "Story" }] : []),
              ...(profile.tier === 2 ? [{ href: "#summary", label: "Summary" }] : []),
              ...(profile.seasonalEvents.length > 0 ? [{ href: "#events", label: "Seasonal events" }] : []),
            ]}
          />

          <div className="mt-6 rounded-xl bg-surface-2 border border-surface-3 p-4">
            <div className="text-sm text-ink-faint font-mono mb-3">Quick decision snapshot</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-base">
              <div className="rounded-lg bg-surface-3/55 border border-surface-3 p-3">
                <div className="text-xs text-ink-faint font-mono mb-1">Best month to visit</div>
                <div className="text-ink font-semibold">
                  {profile.healthMetrics.bestVisitMonthName ?? "No clear seasonal winner"}
                </div>
              </div>

              <div className="rounded-lg bg-surface-3/55 border border-surface-3 p-3">
                <div className="text-xs text-ink-faint font-mono mb-1">Worst month</div>
                <div className="text-ink font-semibold">
                  {profile.healthMetrics.worstMonthName}
                  {profile.healthMetrics.worstMonthMedian != null
                    ? ` (${profile.healthMetrics.worstMonthMedian.toFixed(1)} µg/m³)`
                    : ""}
                </div>
              </div>

              <div className="rounded-lg bg-surface-3/55 border border-surface-3 p-3">
                <div className="text-xs text-ink-faint font-mono mb-1">Safer walk window (typical day)</div>
                <div className="text-ink font-semibold">
                  {bestWalkWindow
                    ? `${bestWalkWindow.label} · ${bestWalkWindow.durationHours}h`
                    : "Limited or unavailable hourly data"}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <a href="#calendar" className="control-chip text-[11px]">
                Check seasonal calendar
              </a>
              <a href="#clock" className="control-chip text-[11px]">
                Check hourly clock
              </a>
            </div>
          </div>
        </section>

        {/* ── Health Metrics ─────────────────────────────────────────────── */}
        <section id="health" className="pb-12 scroll-mt-6">
          <h2 className="font-editorial text-2xl font-semibold text-ink mb-5">Health impact</h2>
          <HealthMetricsPanel profile={profile} />
        </section>

        {/* ── Lung Clock ─────────────────────────────────────────────────── */}
        <section id="clock" className="pb-12 scroll-mt-6">
          <h2 className="font-editorial text-2xl font-semibold text-ink mb-2">Lung clock</h2>
          <p className="text-sm text-ink-muted mb-5">
            24-hour air quality pattern. Dimmed arcs are unsafe for the selected activity.
          </p>
          {hasHourlyAny ? (
            <div className="rounded-xl bg-surface-2 border border-surface-3 p-5 motion-heavy-block" data-heavy-block>
              {!hasHourlyFull && (
                <div className="mb-3 text-sm text-ink-muted font-mono">
                  Partial hourly data: showing {hourlyCount}/24 hours. Missing hours are marked as gray arcs.
                </div>
              )}
              <LungClock
                typicalDay={hourly!.typicalDay}
                lat={profile.coordinates.lat}
                cityName={profile.cityName}
                timezone={profile.timezone}
              />
            </div>
          ) : (
            <div className="rounded-xl bg-surface-2 border border-surface-3 p-5">
              <p className="text-sm text-ink-muted">
                Hourly data is currently unavailable for this city. You can still use the seasonal calendar and health summary.
              </p>
            </div>
          )}
        </section>

        {/* ── Life Expectancy Chart (Tier 1 + 2 only) ──────────────────── */}
        {profile.tier <= 2 && (
          <section id="life" className="pb-12 scroll-mt-6">
            <h2 className="font-editorial text-2xl font-semibold text-ink mb-2">Life expectancy toll</h2>
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
        )}

        {/* ── Breathing Calendar ─────────────────────────────────────────── */}
        <section id="calendar" className="pb-12 scroll-mt-6">
          <h2 className="font-editorial text-2xl font-semibold text-ink mb-2">Breathing calendar</h2>
          <p className="text-sm text-ink-muted mb-5">
            Every day of the year, colored by PM2.5 air quality band.
          </p>
          <div className="relative rounded-xl bg-surface-2 border border-surface-3 p-5 motion-heavy-block" data-heavy-block>
            <BreathingCalendar heatmap={heatmap} />
          </div>
        </section>

        {/* ── Cigarette Counter + Trip Calc ──────────────────────────────── */}
        <section id="exposure" className="pb-12 scroll-mt-6">
          <h2 className="font-editorial text-2xl font-semibold text-ink mb-5">Exposure calculator</h2>
          <p className="text-sm text-ink-muted mb-5">
            The baseline view is <strong className="text-ink">No mask</strong>. You can switch to Surgical, KN95, or N95 to see a planning range for mask-adjusted exposure. Smoking-aware mode is optional and off by default.
          </p>
          <CigaretteCounter profile={profile} />
        </section>

        {/* ── Scrollytelling (Tier 1 only) ───────────────────────────────── */}
        {profile.tier === 1 && (
          <section id="story" className="pb-12 scroll-mt-6">
            <h2 className="font-editorial text-2xl font-semibold text-ink mb-2">The Story</h2>
            <p className="text-sm text-ink-muted mb-6">
              Scroll through to see the numbers come alive.
            </p>
            <div className="rounded-xl bg-surface-2 border border-surface-3 overflow-hidden motion-heavy-block" data-heavy-block>
              <ScrollyTelling profile={profile} />
            </div>
          </section>
        )}

        {/* ── City Summary (Tier 2 only) ─────────────────────────────────── */}
        {profile.tier === 2 && profile.narrativeSummary && (
          <section id="summary" className="pb-12 scroll-mt-6">
            <h2 className="font-editorial text-2xl font-semibold text-ink mb-2">City profile</h2>
            <p className="text-sm text-ink-muted mb-6">
              Research-backed air quality summary for {profile.cityName}.
            </p>
            <div className="rounded-xl bg-surface-2 border border-surface-3 p-6">
              <CitySummaryPanel profile={profile} />
            </div>
          </section>
        )}

        {/* ── Seasonal events ────────────────────────────────────────────── */}
        {profile.seasonalEvents.length > 0 && (
          <section id="events" className="pb-12 scroll-mt-6">
            <h2 className="font-editorial text-2xl font-semibold text-ink mb-5">Seasonal risk events</h2>
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
                        <span className="text-base font-semibold text-ink">{ev.event}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                          style={{ background: riskColor, color: ev.risk_level === "high" ? "#fff" : "#000" }}
                        >
                          {ev.risk_level}
                        </span>
                      </div>
                      <p className="text-sm text-ink-muted">{ev.cause}</p>
                      <p className="text-xs text-ink-muted mt-1 font-mono">
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
              <a href="/about" className="link-underline-reveal transition-colors hover:text-ink">Methodology →</a>
            </div>
            <div>
              <Link href="/" className="link-underline-reveal transition-colors hover:text-ink">← Back to overview</Link>
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}
