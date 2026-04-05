/**
 * About / Methodology page
 *
 * Full methodology reference — data sources, PM2.5 bands, cigarette
 * equivalence, AQLI life-years formula, known limitations, credits.
 */

import Link from "next/link";

// WHO 2021 band table
const BANDS = [
  { range: "0 – 15 µg/m³",   label: "Good",                color: "#4CAF50", detail: "WHO 2021 annual target. Safe for all outdoor activities." },
  { range: "15 – 25 µg/m³",  label: "Moderate",            color: "#FFC107", detail: "Acceptable for most people. Sensitive groups may notice mild effects." },
  { range: "25 – 50 µg/m³",  label: "Unhealthy (sensitive)", color: "#FF9800", detail: "People with asthma, heart or lung disease should reduce prolonged outdoor exertion." },
  { range: "50 – 100 µg/m³", label: "Unhealthy",            color: "#F44336", detail: "General population begins experiencing health effects. Reduce outdoor time." },
  { range: "100+ µg/m³",     label: "Hazardous",            color: "#9C27B0", detail: "Serious risk for everyone. Avoid outdoor activity. N95 mask if unavoidable." },
];

const COMPARISON_ANCHORS = [
  { risk: "Smoking (1 cigarette/day)",      yearsLost: "~1.0 yr", source: "Berkeley Earth / WHO" },
  { risk: "Heavy alcohol use",              yearsLost: "~1.3 yr", source: "GBD 2019" },
  { risk: "Traffic accidents (avg risk)",   yearsLost: "~0.3 yr", source: "GBD 2019" },
  { risk: "This city's air",                yearsLost: "dynamic", source: "AQLI" },
];

const SECTION_LINKS = [
  { id: "data-sources", label: "Data sources" },
  { id: "pm25-bands", label: "PM2.5 bands" },
  { id: "cigarette-equivalence", label: "Cigarette equivalence" },
  { id: "aqli", label: "Life-expectancy impact" },
  { id: "lung-clock", label: "Lung clock" },
  { id: "limitations", label: "Known limitations" },
  { id: "credits", label: "Credits" },
];

export default function AboutPage() {
  return (
    <main className="reading-surface min-h-screen bg-[#080B12] px-5 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Back nav */}
        <div className="mb-8">
          <Link href="/" className="link-underline-reveal text-base text-ink-muted font-mono hover:text-ink transition-colors">
            ← Back to overview
          </Link>
        </div>

        <div>

            {/* Header */}
            <header className="mb-8">
              <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-ink leading-tight mb-3">Methodology</h1>
              <div className="h-px w-48 sm:w-64 bg-ink-faint/40 mb-4 motion-glow-line" aria-hidden="true" />
              <p className="font-ui text-base sm:text-lg text-ink-muted max-w-2xl leading-relaxed">
                Everything here is built on publicly available data and peer-reviewed methodology.
                This page explains every number you see: what it means, where it comes from, and where
                its limitations are.
              </p>
            </header>

            <div className="mb-8 rounded-xl bg-surface-2 border border-surface-3 p-5">
              <div className="text-base text-ink-faint font-mono mb-3">Reading guide</div>
              <div className="grid sm:grid-cols-3 gap-3 text-base">
                <div className="rounded-lg bg-surface-3/60 border border-surface-3 p-3">
                  <div className="text-xs text-ink-faint font-mono mb-1">Scope</div>
                  <div className="font-ui text-ink">Data sources, formulas, caveats</div>
                </div>
                <div className="rounded-lg bg-surface-3/60 border border-surface-3 p-3">
                  <div className="text-xs text-ink-faint font-mono mb-1">Reading effort</div>
                  <div className="font-ui text-ink">About 4-6 minutes</div>
                </div>
                <div className="rounded-lg bg-surface-3/60 border border-surface-3 p-3">
                  <div className="text-xs text-ink-faint font-mono mb-1">Trust check</div>
                  <div className="font-ui text-ink">Formula-to-UI wording aligned</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
                {SECTION_LINKS.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="px-2.5 py-1.5 rounded-full border border-surface-3 bg-surface-3 text-base text-ink-muted hover:text-ink hover:border-ink-faint/70 transition-colors"
                  >
                    {section.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-6">

          {/* Data sources */}
          <section id="data-sources" className="rounded-xl bg-surface-2 border border-surface-3 p-6 space-y-5 motion-card scroll-mt-24">
            <h2 className="font-editorial text-2xl font-semibold text-ink">Data Sources</h2>

            <div className="space-y-4">
              <div>
                <div className="font-ui text-lg font-semibold text-ink mb-1">OpenAQ API v3</div>
                <p className="font-ui text-base sm:text-lg text-ink-muted leading-8">
                  Primary PM2.5 source. Historical daily aggregates pulled via the{" "}
                  <code className="text-sm bg-surface-3 px-1 py-0.5 rounded">/sensors/&#123;id&#125;/days</code>{" "}
                  endpoint. Data is pre-computed nightly and stored as static JSON under{" "}
                  <code className="text-sm bg-surface-3 px-1 py-0.5 rounded">public/data/cities/</code>.
                  Coverage varies by city (typically 1–5 years of station history).
                </p>
              </div>

              <div>
                <div className="font-ui text-lg font-semibold text-ink mb-1">WHO 2021 Air Quality Guidelines</div>
                <p className="font-ui text-base sm:text-lg text-ink-muted leading-8">
                  Annual PM2.5 guideline: 5 µg/m³. This is the primary safety benchmark used across
                  all visualizations. The 2021 revision tightened the previous 10 µg/m³ limit based on
                  updated evidence for long-term cardiovascular and respiratory effects.
                </p>
              </div>

              <div>
                <div className="font-ui text-lg font-semibold text-ink mb-1">Berkeley Earth</div>
                <p className="font-ui text-base sm:text-lg text-ink-muted leading-8">
                  Source for the cigarette equivalence conversion factor (22 µg/m³ PM2.5 ≈ 1
                  cigarette/day). Based on population-level mortality risk comparison.
                </p>
              </div>

              <div>
                <div className="font-ui text-lg font-semibold text-ink mb-1">AQLI (Air Quality Life Index)</div>
                <p className="font-ui text-base sm:text-lg text-ink-muted leading-8">
                  Framework from the Energy Policy Institute at the University of Chicago (EPIC).
                  Used for life-expectancy impact calculations. Formula documented in the section below.
                </p>
              </div>
            </div>
          </section>

          {/* PM2.5 bands */}
          <section id="pm25-bands" className="rounded-xl bg-surface-2 border border-surface-3 p-6 space-y-4 motion-card scroll-mt-24">
            <h2 className="font-editorial text-2xl font-semibold text-ink">PM2.5 Safety Bands (WHO 2021)</h2>
            <p className="font-ui text-base sm:text-lg text-ink-muted leading-8">
              These five bands drive all colors across the calendar, map, and clock visualizations.
            </p>

            <div className="space-y-2">
              {BANDS.map((b) => (
                <div key={b.label} className="flex gap-3 rounded-lg bg-surface-3 p-3 transition-colors hover:bg-surface-3/75">
                  <div
                    className="w-1 rounded-full flex-shrink-0 self-stretch"
                    style={{ background: b.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2 mb-0.5">
                      <span className="text-base font-semibold" style={{ color: b.color }}>{b.label}</span>
                      <span className="text-base text-ink-muted font-mono">{b.range}</span>
                    </div>
                    <p className="font-ui text-base text-ink-muted leading-7">{b.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="font-ui text-sm text-ink-muted leading-relaxed">
              The 15 µg/m³ good/moderate threshold is set at 3× the WHO annual guideline to reflect
              realistic short-visit exposure rather than strict annual-average health thresholds.
            </p>
          </section>

          {/* Cigarette equivalence */}
          <section id="cigarette-equivalence" className="rounded-xl bg-surface-2 border border-surface-3 p-6 space-y-4 motion-card scroll-mt-24">
            <h2 className="font-editorial text-2xl font-semibold text-ink">Cigarette Equivalence</h2>

            <div className="rounded-lg bg-surface-3 border border-surface-3 p-4">
              <div className="text-base text-ink-muted font-mono mb-1">Conversion formula</div>
              <div className="text-base font-mono text-ink">
                cigarettes/day = PM2.5 (µg/m³) ÷ 22
              </div>
            </div>

            <p className="font-ui text-base sm:text-lg text-ink-muted leading-8">
              This conversion, popularized by Berkeley Earth, compares the long-run mortality risk
              associated with ambient PM2.5 to the risk from active cigarette smoking. A person
              breathing air at 22 µg/m³ for a full year faces a statistically similar mortality
              burden increase as someone smoking one cigarette per day.
            </p>

            <p className="font-ui text-sm text-ink-muted leading-relaxed">
              In this app, the cigarette-equivalence headline uses the annual median PM2.5 to represent
              a robust typical exposure level and reduce outlier distortion.
            </p>

            <div className="space-y-1.5">
              <div className="font-editorial text-base font-semibold text-ink">Important caveats</div>
              <ul className="font-ui space-y-2 text-base text-ink-muted leading-7">
                <li className="flex gap-2"><span className="text-yellow-400 flex-shrink-0">▸</span>
                  Ambient PM2.5 and cigarette smoke have different chemical compositions. The comparison is a mortality-risk analogy, not a toxicological equivalence.
                </li>
                <li className="flex gap-2"><span className="text-yellow-400 flex-shrink-0">▸</span>
                  Short-term visits incur far less cumulative exposure than a year-round resident. The displayed value assumes permanent residence.
                </li>
                <li className="flex gap-2"><span className="text-yellow-400 flex-shrink-0">▸</span>
                  Indoor air quality (home filtration, time indoors) can significantly reduce personal exposure relative to the outdoor median shown here.
                </li>
                <li className="flex gap-2"><span className="text-yellow-400 flex-shrink-0">▸</span>
                  This is a population-level statistical estimate. Individual health outcomes depend on age, pre-existing conditions, genetics, and activity level.
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-surface-3 border border-surface-3 p-4 space-y-2">
              <div className="text-base text-ink-muted font-mono mb-1">Mask-adjusted scenario</div>
              <p className="font-ui text-base sm:text-lg text-ink-muted leading-8">
                The exposure calculator also supports an optional mask scenario: <strong className="text-ink">No mask</strong> remains the baseline, and users can switch to Surgical, KN95, or N95 to see an estimated range. This is a planning aid only, not a guarantee of protection.
              </p>
              <p className="font-ui text-sm text-ink-muted leading-relaxed">
                Because fit, humidity, wear time, and activity level vary, the app shows a range rather than a single exact number.
              </p>
            </div>
          </section>

          {/* AQLI life years */}
          <section id="aqli" className="rounded-xl bg-surface-2 border border-surface-3 p-6 space-y-4 motion-card scroll-mt-24">
            <h2 className="font-editorial text-2xl font-semibold text-ink">Life-Expectancy Impact (AQLI)</h2>

            <div className="rounded-lg bg-surface-3 border border-surface-3 p-4 space-y-2">
              <div className="text-base text-ink-muted font-mono mb-1">Formula used</div>
              <div className="text-base font-mono text-ink">
                years lost = (annual mean PM2.5 − 5) × (0.98 ÷ 10)
              </div>
              <div className="text-base text-ink-muted">
                where 5 µg/m³ = WHO baseline, 0.98 yr = years lost per 10 µg/m³ above baseline
              </div>
            </div>

            <p className="font-ui text-base sm:text-lg text-ink-muted leading-8">
              The AQLI framework translates PM2.5 exposure above the WHO baseline into estimated
              reductions in life expectancy. The coefficient (0.98 years per 10 µg/m³) is derived
              from epidemiological studies on long-term PM2.5 exposure and mortality.
            </p>

            <p className="font-ui text-sm text-ink-muted leading-relaxed">
              In this app, years lost is calculated from annual mean PM2.5 (long-term exposure proxy),
              not annual median.
            </p>

            <div className="space-y-2">
              <div className="font-editorial text-base font-semibold text-ink">Comparison anchors used in charts</div>
              <div className="rounded-lg overflow-hidden border border-surface-3">
                <table className="w-full text-base text-ink-muted">
                  <thead>
                    <tr className="bg-surface-3">
                      <th className="text-left p-2.5 font-mono font-semibold text-ink">Risk</th>
                      <th className="text-right p-2.5 font-mono font-semibold text-ink">Years lost</th>
                      <th className="text-right p-2.5 font-mono font-semibold text-ink">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-3">
                    {COMPARISON_ANCHORS.map((r) => (
                      <tr key={r.risk} className="transition-colors duration-200 hover:bg-surface-3/65">
                        <td className="p-2.5">{r.risk}</td>
                        <td className="p-2.5 text-right font-mono">{r.yearsLost}</td>
                        <td className="p-2.5 text-right">{r.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="font-ui text-sm text-ink-muted leading-relaxed">
              These are population-level estimates. They describe the average statistical impact
              on a large group, not a prediction for any individual. Always consult a healthcare
              professional for personal health decisions.
            </p>
          </section>

          {/* Lung Clock */}
          <section id="lung-clock" className="rounded-xl bg-surface-2 border border-surface-3 p-6 space-y-4 motion-card scroll-mt-24">
            <h2 className="font-editorial text-2xl font-semibold text-ink">Lung Clock — Hourly Patterns</h2>
            <p className="font-ui text-base sm:text-lg text-ink-muted leading-8">
              The Lung Clock shows a &ldquo;typical day&rdquo; — the hourly median PM2.5 across the
              most recent 7 days of available sensor data. It is a snapshot of recent patterns,
              not a historical average. The daylight arc uses a solar declination model (Spencer 1971)
              calculated from the city&apos;s coordinates and current date.
            </p>
            <ul className="font-ui space-y-2 text-base text-ink-muted leading-7">
              <li className="flex gap-2"><span className="text-ink-muted flex-shrink-0">▸</span>
                Hours with no sensor data are shown as gray arcs.
              </li>
              <li className="flex gap-2"><span className="text-ink-muted flex-shrink-0">▸</span>
                Activity safety dots (walk/cycle/jog) use the same WHO band thresholds as the calendar.
              </li>
              <li className="flex gap-2"><span className="text-ink-muted flex-shrink-0">▸</span>
                Hourly data is unavailable for some cities due to sensor gaps. The calendar view
                is available for all cities as it uses aggregated daily data.
              </li>
            </ul>
          </section>

          {/* Limitations */}
          <section id="limitations" className="rounded-xl bg-surface-2 border border-surface-3 p-6 space-y-4 motion-card scroll-mt-24" data-reveal>
            <h2 className="font-editorial text-2xl font-semibold text-ink">Known Limitations</h2>
            <ul className="font-ui space-y-3 text-base sm:text-lg text-ink-muted leading-8">
              <li className="flex gap-2">
                <span className="text-red-400 flex-shrink-0 font-bold">!</span>
                <span><strong className="text-ink">Single parameter:</strong> Only PM2.5 is tracked. NO₂, O₃, and CO₂ are not included, which may understate total air quality burden in some cities.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-400 flex-shrink-0 font-bold">!</span>
                <span><strong className="text-ink">Station coverage:</strong> Data reflects sensors connected to OpenAQ. Cities with fewer or poorly distributed sensors may not capture intra-city variation.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-400 flex-shrink-0 font-bold">!</span>
                <span><strong className="text-ink">Historical depth:</strong> Some cities have only 1–2 years of data. Seasonal patterns derived from limited years are less reliable than those from 5+ years.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-400 flex-shrink-0 font-bold">!</span>
                <span><strong className="text-ink">Year-round assumption:</strong> Health metrics (cigarettes, years lost) assume permanent residence. Short-term visitors face proportionally lower exposure.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-400 flex-shrink-0 font-bold">!</span>
                <span><strong className="text-ink">Not medical advice:</strong> Nothing on this site constitutes medical advice. Consult a healthcare professional before making health decisions based on air quality data.</span>
              </li>
            </ul>
          </section>

          {/* Credits */}
          <section id="credits" className="rounded-xl bg-surface-2 border border-surface-3 p-6 space-y-3 motion-card scroll-mt-24">
            <h2 className="font-editorial text-2xl font-semibold text-ink">Credits</h2>
            <div className="font-ui space-y-2 text-base sm:text-lg text-ink-muted leading-8">
              <div className="flex justify-between transition-colors duration-200 hover:text-ink rounded-md px-1">
                <span>Air quality data</span>
                <span className="font-mono">OpenAQ (openaq.org)</span>
              </div>
              <div className="flex justify-between transition-colors duration-200 hover:text-ink rounded-md px-1">
                <span>Health guidelines</span>
                <span className="font-mono">WHO 2021 AQG</span>
              </div>
              <div className="flex justify-between transition-colors duration-200 hover:text-ink rounded-md px-1">
                <span>Cigarette conversion</span>
                <span className="font-mono">Berkeley Earth</span>
              </div>
              <div className="flex justify-between transition-colors duration-200 hover:text-ink rounded-md px-1">
                <span>Life-years framework</span>
                <span className="font-mono">EPIC / AQLI</span>
              </div>
              <div className="flex justify-between transition-colors duration-200 hover:text-ink rounded-md px-1">
                <span>Solar model</span>
                <span className="font-mono">Spencer (1971)</span>
              </div>
              <div className="flex justify-between transition-colors duration-200 hover:text-ink rounded-md px-1">
                <span>Built with</span>
                <span className="font-mono">Next.js 15, D3.js v7, Tailwind CSS</span>
              </div>
            </div>
          </section>

            </div>

            {/* Footer */}
            <footer className="mt-10 border-t border-surface-3 pt-6 text-sm text-ink-muted font-mono flex flex-col sm:flex-row justify-between gap-2">
              <span>Breathe Before You Go · air quality decision intelligence</span>
              <Link href="/" className="link-underline-reveal hover:text-ink transition-colors">← Back to city overview</Link>
            </footer>
        </div>

      </div>
    </main>
  );
}
