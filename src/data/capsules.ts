import type { Capsule } from "../types";
import raw from "./capsules.json";

export const capsules = raw as Capsule[];

export function findCapsule(iso: string, year: number): Capsule | undefined {
  return capsules.find((c) => c.iso === iso && c.year === year);
}

/** Sorted list of years available for a country, e.g. [2004, 2005, 2006, 2007]. */
export function yearsFor(iso: string): number[] {
  return capsules
    .filter((c) => c.iso === iso)
    .map((c) => c.year)
    .sort((a, b) => a - b);
}

/** Countries with at least one capsule, in first-seen order — the lit map targets. */
export const activeCountries: { iso: string; label: string }[] = (() => {
  const byIso = new Map<string, string>();
  for (const c of capsules) if (!byIso.has(c.iso)) byIso.set(c.iso, c.countryName);
  return [...byIso].map(([iso, label]) => ({ iso, label }));
})();

/** The year a country opens to when clicked. Falls back to its earliest year. */
const HERO_YEAR_BY_ISO: Record<string, number> = { USA: 2005, RUS: 2006 };
export function heroYearFor(iso: string): number {
  return HERO_YEAR_BY_ISO[iso] ?? yearsFor(iso)[0];
}
