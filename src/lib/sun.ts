/**
 * sun.ts — Sunrise / sunset approximation
 *
 * Uses the Spencer (1971) solar declination + NOAA hour-angle formula.
 * Accurate to ±10 minutes for latitudes < 60°. Good enough for the
 * Lung Clock sunrise overlay on the city page.
 *
 * All times are LOCAL SOLAR TIME (not wall-clock time) — adequate for
 * a visual overlay where the exact zone offset doesn't change the story.
 */

/** Day of year (1–365) from a Date object. */
export function dayOfYear(date: Date = new Date()): number {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  return Math.ceil((date.getTime() - jan1.getTime()) / 86_400_000) + 1;
}

/**
 * Compute approximate sunrise and sunset in local solar hours (0–24).
 *
 * @param lat - latitude in decimal degrees (north = positive)
 * @param doy - day of year (1–365)
 */
export function computeSunriseSunset(
  lat: number,
  doy: number,
): { sunrise: number; sunset: number } {
  const toRad = Math.PI / 180;

  // Solar declination — Spencer 1971 simplified
  const decl = 23.45 * Math.sin(toRad * (360 / 365) * (doy - 81));

  // Cosine of the hour angle at sunrise/sunset
  const cosH = -Math.tan(lat * toRad) * Math.tan(decl * toRad);

  // Polar extremes: midnight sun or polar night
  if (cosH <= -1) return { sunrise: 0,  sunset: 24 };
  if (cosH >= 1)  return { sunrise: 12, sunset: 12 };

  const halfDayHours = (Math.acos(cosH) / toRad) / 15;

  return {
    sunrise: 12 - halfDayHours,
    sunset:  12 + halfDayHours,
  };
}
