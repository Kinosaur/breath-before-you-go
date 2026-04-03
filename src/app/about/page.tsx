/**
 * About / Methodology page
 *
 * Concise methodology reference for trust and transparency:
 *   • Data sources and update model
 *   • WHO PM2.5 safety band rules (primary metric)
 *   • Cigarette equivalence framing caveats
 *   • AQLI life-years context
 */

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-5 py-10">
      <div className="max-w-3xl mx-auto space-y-8">

        <div>
          <Link
            href="/"
            className="text-xs text-ink-muted font-mono hover:text-ink transition-colors"
          >
            ← Back to overview
          </Link>
        </div>

        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-ink">Methodology</h1>
          <p className="text-sm text-ink-muted max-w-2xl leading-relaxed">
            This project combines pre-computed historical PM2.5 data with clear health framing.
            WHO 2021 PM2.5 guidance is the primary safety standard.
            Cigarette equivalence is presented as a communication aid with explicit caveats.
          </p>
        </header>

        <section className="rounded-xl bg-surface-2 border border-surface-3 p-5 space-y-3">
          <h2 className="text-lg font-semibold text-ink">Data and Update Model</h2>
          <ul className="text-sm text-ink-muted space-y-1.5">
            <li>Primary source: OpenAQ API v3 (historical PM2.5 observations).</li>
            <li>Storage model: pre-computed JSON in public/data served statically.</li>
            <li>Freshness states: Live (&lt;2h), Delayed (2–24h), Historical (&gt;24h).</li>
          </ul>
        </section>

        <section className="rounded-xl bg-surface-2 border border-surface-3 p-5 space-y-3">
          <h2 className="text-lg font-semibold text-ink">WHO 2021 PM2.5 Bands</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-ink-muted font-mono">
            <div>Good: 0–15 µg/m³</div>
            <div>Moderate: 15–25 µg/m³</div>
            <div>Sensitive: 25–50 µg/m³</div>
            <div>Unhealthy: 50–100 µg/m³</div>
            <div className="sm:col-span-2">Hazardous: 100+ µg/m³</div>
          </div>
          <p className="text-[11px] text-ink-muted">
            These bands drive calendar colors, map marker colors, and safety wording.
          </p>
        </section>

        <section className="rounded-xl bg-surface-2 border border-surface-3 p-5 space-y-3">
          <h2 className="text-lg font-semibold text-ink">Cigarette Equivalence</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Conversion used: 22 µg/m³ PM2.5 ≈ 1 cigarette/day (Berkeley Earth framing).
            This is a population-level communication heuristic, not a clinical diagnosis.
          </p>
          <ul className="text-xs text-ink-muted space-y-1">
            <li>Short-term exposure and smoking are not biologically identical.</li>
            <li>Local concentration and activity pattern can change personal exposure materially.</li>
            <li>Use this number to compare risk context, not as a medical estimate.</li>
          </ul>
        </section>

        <section className="rounded-xl bg-surface-2 border border-surface-3 p-5 space-y-3">
          <h2 className="text-lg font-semibold text-ink">Life-Years Context (AQLI-style)</h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Life-years comparisons are directional context values, intended to help users interpret
            long-run burden across cities and seasons.
          </p>
          <p className="text-xs text-ink-muted">
            Full source notes and expanded citations will continue evolving in Week 8.
          </p>
        </section>

        <footer className="text-[11px] text-ink-muted font-mono border-t border-surface-3 pt-6">
          Transparency first: metric assumptions are shown in-page wherever values appear.
        </footer>
      </div>
    </main>
  );
}
