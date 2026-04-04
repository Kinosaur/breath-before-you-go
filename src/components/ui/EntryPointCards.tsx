/**
 * EntryPointCards — Server Component
 *
 * Blueprint §Dual Entry Point Design (v2.0):
 *   "Plan a Trip" → Travel mode: Breathing Calendar first, best month badge
 *   "My City"     → Resident mode: Lung Clock first, real-time safe windows
 *
 * Both paths lead to the same city pages but with different default viz
 * ordering. The ?mode param is read by city pages in Week 4.
 */

import Link from "next/link";

interface EntryCard {
  href:        string;
  icon:        string;
  title:       string;
  description: string;
  detail:      string;
  accentClass: string;        // Tailwind hover color
  borderClass: string;
}

const CARDS: EntryCard[] = [
  {
    href:        "/?mode=travel#map",
    icon:        "✈️",
    title:       "Plan a Trip",
    description: "Pick a city, compare months, and decide when to go with lower pollution risk.",
    detail:      "Best month · Seasonal calendar · Trip exposure estimate",
    accentClass: "group-hover:text-aqi-good",
    borderClass: "hover:border-aqi-good/40",
  },
  {
    href:        "/?mode=resident#map",
    icon:        "🏙️",
    title:       "My City",
    description: "See the city's typical daily pattern and identify safer windows for outdoor plans.",
    detail:      "Lung clock · Safer hour windows · Health snapshot",
    accentClass: "group-hover:text-aqi-moderate",
    borderClass: "hover:border-aqi-moderate/40",
  },
];

export function EntryPointCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {CARDS.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className={`group block p-6 rounded-xl border border-surface-3 bg-surface-2
                      ${card.borderClass}
                      hover:bg-surface-3 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.24)]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-faint focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                      transition-all duration-200`}
        >
          <div className="text-3xl mb-3 transition-transform duration-200 group-hover:scale-105" aria-hidden="true">
            {card.icon}
          </div>

          <h2 className={`font-editorial text-xl font-semibold mb-2 transition-colors ${card.accentClass}`}>
            {card.title}
          </h2>

          <p className="text-base text-ink-muted leading-relaxed mb-4">
            {card.description}
          </p>

          <p className="text-sm font-mono text-ink-faint">
            {card.detail}
          </p>

          <div className={`mt-4 text-sm font-medium transition-all duration-200 ${card.accentClass} text-ink-faint group-hover:translate-x-0.5`}>
            Get started →
          </div>
        </Link>
      ))}
    </div>
  );
}
