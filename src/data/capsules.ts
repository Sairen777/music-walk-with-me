import type { Capsule } from "../types";
import raw from "./capsules.json";

export const capsules = raw as Capsule[];

/** The hero loop the product opens on. */
export const HERO_ISO = "USA";
export const HERO_YEAR = 2005;

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

/** ISO codes that have at least one capsule (lit on the map). */
export const litCountries: ReadonlySet<string> = new Set(capsules.map((c) => c.iso));
