/**
 * About / Methodology page — Week 8 placeholder
 *
 * Full methodology writeup (data sources, cigarette equivalence model,
 * AQLI life-years calculation, pipeline architecture) will be written
 * in Week 8 alongside the narrative essay tier.
 *
 * This stub exists so the footer "Methodology →" link doesn't 404.
 */

import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-5">
      <div className="max-w-lg text-center space-y-6">

        <div className="text-5xl" aria-hidden="true">📖</div>

        <h1 className="text-2xl font-bold text-ink">Methodology</h1>

        <p className="text-ink-muted leading-relaxed">
          A full explanation of the data pipeline, WHO 2021 PM2.5 bands,
          Berkeley Earth cigarette equivalence model, and AQLI life-years
          calculation is coming in Week 8.
        </p>

        <div className="text-left space-y-3 text-sm text-ink-faint font-mono border border-surface-3 rounded-xl p-5">
          <div className="text-ink font-semibold mb-4 text-base">Quick reference</div>
          <div><span className="text-ink">Data source:</span> OpenAQ API v3 · 5 years of daily PM2.5</div>
          <div><span className="text-ink">Band thresholds:</span> WHO 2021 guidelines (µg/m³)</div>
          <div className="pl-3 space-y-1 text-ink-faint">
            <div>Good · 0–15 · 🟢</div>
            <div>Moderate · 15–25 · 🟡</div>
            <div>Unhealthy for sensitive · 25–50 · 🟠</div>
            <div>Unhealthy · 50–100 · 🔴</div>
            <div>Hazardous · 100+ · 🟣</div>
          </div>
          <div><span className="text-ink">Cigarette equivalence:</span> 22 µg/m³ PM2.5 = 1 cigarette/day</div>
          <div className="text-[11px] mt-2">
            Statistical communication tool — not a clinical diagnosis.
          </div>
        </div>

        <div className="inline-flex items-center gap-2 text-xs font-mono text-ink-faint border border-surface-3 rounded-full px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" aria-hidden="true" />
          Full writeup · Week 8
        </div>

        <div>
          <Link
            href="/"
            className="text-sm text-ink-muted underline hover:text-ink transition-colors"
          >
            ← Back to overview
          </Link>
        </div>
      </div>
    </main>
  );
}
