/**
 * City page — Week 4 placeholder
 *
 * Full city profile (Breathing Calendar, Lung Clock, AQI heatmap,
 * health metrics) will be built in Week 4.
 *
 * This stub exists so CityGrid links don't 404 during Weeks 1–3 demos.
 */

import Link from "next/link";
import { getCityProfile } from "@/lib/data";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CityPage({ params }: Props) {
  const { id } = await params;

  // Best-effort: load profile for the name; fall back gracefully if missing.
  let cityName = id;
  try {
    const profile = getCityProfile(id);
    cityName = profile.cityName;
  } catch {
    // profile not found — show id as fallback
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-5">
      <div className="max-w-md text-center space-y-6">

        <div className="text-5xl" aria-hidden="true">🏗️</div>

        <h1 className="text-2xl font-bold text-ink">{cityName}</h1>

        <p className="text-ink-muted leading-relaxed">
          Full city profile — Breathing Calendar, Lung Clock, seasonal
          heatmap, and health metrics — is coming in Week 4.
        </p>

        <div className="inline-flex items-center gap-2 text-xs font-mono text-ink-faint border border-surface-3 rounded-full px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" aria-hidden="true" />
          Week 4 · In progress
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
