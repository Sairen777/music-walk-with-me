import type { Capsule, CountryIndex } from "../types";

const BASE = import.meta.env.BASE_URL;

let indexPromise: Promise<CountryIndex[]> | null = null;
const countryCache = new Map<string, Promise<Capsule[]>>();

/** Fetch the lightweight country index for the map (cached, no track data). */
export function loadIndex(): Promise<CountryIndex[]> {
  indexPromise ??= fetch(`${BASE}data/index.json`).then((r) => {
    if (!r.ok) throw new Error(`index.json ${r.status}`);
    return r.json() as Promise<CountryIndex[]>;
  });
  return indexPromise;
}

/** Fetch one country's capsules on demand (cached for the session). */
export function loadCountry(iso: string): Promise<Capsule[]> {
  let pending = countryCache.get(iso);
  if (!pending) {
    pending = fetch(`${BASE}data/${iso}.json`).then((r) => {
      if (!r.ok) throw new Error(`${iso}.json ${r.status}`);
      return r.json() as Promise<Capsule[]>;
    });
    countryCache.set(iso, pending);
  }
  return pending;
}

/** Editorial landing year per country; falls back to the earliest available. */
const HERO_YEAR_BY_ISO: Record<string, number> = { USA: 2005, RUS: 2006 };
export function heroYearFor(iso: string, years: number[]): number {
  const hero = HERO_YEAR_BY_ISO[iso];
  return hero && years.includes(hero) ? hero : years[0];
}
