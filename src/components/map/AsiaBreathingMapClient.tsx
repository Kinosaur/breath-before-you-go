"use client";

import dynamic from "next/dynamic";
import type { CityIndexEntry } from "@/lib/types";

const AsiaBreathingMap = dynamic(
  () => import("@/components/map/AsiaBreathingMap"),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-xl bg-surface-2 flex items-center justify-center"
        style={{ height: "clamp(320px, 62vh, 500px)" }}
        aria-label="Map loading"
      >
        <span className="text-sm text-ink-muted animate-pulse">
          Loading Asia map...
        </span>
      </div>
    ),
  }
);

type Props = {
  cities: CityIndexEntry[];
};

export function AsiaBreathingMapClient({ cities }: Props) {
  return <AsiaBreathingMap cities={cities} />;
}
