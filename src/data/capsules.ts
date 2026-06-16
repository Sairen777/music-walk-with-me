import type { Capsule } from "../types";

const BASE = import.meta.env.BASE_URL;

const countryCache = new Map<string, Promise<Capsule[]>>();


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

