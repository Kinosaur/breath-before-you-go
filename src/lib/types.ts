/**
 * types.ts
 * TypeScript interfaces that mirror the JSON structure written by the
 * Python pipeline (08_export_json.py). These are the contracts between
 * the data layer and the UI components.
 */

// ── index.json ────────────────────────────────────────────────────────────────

export interface CityIndexEntry {
  id:      string;
  name:    string;
  country: string;
  tier:    1 | 2 | 3;
  coordinates: { lat: number; lon: number };

  annualMedianPm25:       number;
  annualCigarettesPerDay: number;
  yearsLost:              number;
  dominantBand:           string;
  dominantBandColor:      string;

  bestMonth:      { month: number;       name: string;       median: number };
  worstMonth:     { month: number;       name: string;       median: number };
  bestVisitMonth: { month: number | null; name: string | null };

  /** 12-element array, Jan → Dec. May contain null if no data for that month. */
  monthlyMedians: (number | null)[];

  dataQuality: { completenessNote: string };
}

export interface IndexData {
  generated:   string;   // ISO UTC timestamp — used for Data Freshness badge
  cityCount:   number;
  bandColors:  Record<string, string>;
  cities:      CityIndexEntry[];
}

// ── cities/{id}/profile.json ──────────────────────────────────────────────────

export interface AqiDistribution {
  good:                number;
  moderate:            number;
  unhealthy_sensitive: number;
  unhealthy:           number;
  hazardous:           number;
}

export interface MonthlyProfile {
  month:      number;
  monthName:  string;
  monthShort: string;
  p10:  number | null;
  p25:  number | null;
  p50:  number | null;   // median — primary value used in most UIs
  p75:  number | null;
  p90:  number | null;
  mean: number | null;
  aqiDistribution: AqiDistribution;
  dominantBand:    string;
  cigarettesPerDay: number | null;
  daysCount:        number;
  safeDays: { walk: number | null; cycle: number | null; jog: number | null };
}

export interface SeasonalEvent {
  months:     number[];
  event:      string;
  risk_level: "high" | "medium" | "low";
  cause:      string;
}

export interface CityProfile {
  cityId:   string;
  cityName: string;
  country:  string;
  tier:     1 | 2 | 3;
  coordinates: { lat: number; lon: number };
  timezone: string;

  healthMetrics: {
    annualMedianPm25:  number;
    annualMeanPm25:    number;
    cigarettesPerDay:  number;
    yearsLost:         number;
    aqiDistribution:   AqiDistribution;
    bestMonth:         number | null;
    bestMonthName:     string;
    bestMonthMedian:   number | null;
    worstMonth:        number | null;
    worstMonthName:    string;
    worstMonthMedian:  number | null;
    bestVisitMonth:    number | null;
    bestVisitMonthName: string | null;
    cigMethodologyNote:  string;
    aqliMethodologyNote: string;
    lifeExpectancyContext: {
      yearsLost: number;
      comparisonAnchors: Array<{ label: string; yearsLost: number; source: string }>;
    };
  };

  monthlyProfiles:  MonthlyProfile[];
  seasonalEvents:   SeasonalEvent[];
  monthlyRiskIndex: Array<{ month: number; riskLevel: string }>;

  whoData: {
    available: boolean;
    pm25Estimate?:       { value: number | null; year: number; unit: string } | null;
    mortalityPer100k?:   { value: number | null; year: number; unit: string } | null;
  };

  dataQuality: {
    dateFrom:        string;
    dateTo:          string;
    yearsAvailable:  number[];
    totalDays:       number;
    sensors:         number;
    lastComputed:    string;
  };
}

// ── cities/{id}/hourly-latest.json ────────────────────────────────────────────

export interface HourlyEntry {
  hour:         number;   // 0–23 local time
  value:        number;   // PM2.5 µg/m³
  band:         string;
  color:        string;
  safeForWalk:  boolean;
  safeForCycle: boolean;
  safeForJog:   boolean;
}

export interface HourlyLatest {
  cityId:         string;
  parameter:      string;
  available:      boolean;
  fetchedAt:      string;   // ISO UTC — for Data Freshness badge on city page
  mostRecentDate: string | null;
  typicalDay:     HourlyEntry[];                    // median across 7 days per hour
  recentDays:     Record<string, HourlyEntry[]>;   // date string → hourly array
}

// ── Data freshness ────────────────────────────────────────────────────────────

export type FreshnessStatus = "live" | "delayed" | "historical";

export interface FreshnessInfo {
  status:    FreshnessStatus;
  ageHours:  number;
  label:     string;
}
