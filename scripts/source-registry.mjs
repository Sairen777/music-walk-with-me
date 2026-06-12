/**
 * Source registry — maps source ids to adapter functions and decides which
 * sources apply per-country/year.  This is the only file that knows about
 * the country/source matrix; rank.mjs must call into it instead of
 * hard-coding adapter or weight selection.
 */

import {
  billboardYearEndHot100,
  billboardHot100NumberOnes,
  popRadioYearEnd,
  alternativeRadioYearEnd,
  trlArchiveTopTen,
  trlNumberOneVideos,
  tophitAnnualRadio,
  tophitDecadeReleaseYear,
  lastfmListenerEnrichment,
} from "./source-adapters.mjs";

// ---------------------------------------------------------------------------
// Source-adapter lookup table
// ---------------------------------------------------------------------------
export const SOURCE_ADAPTERS = {
  "billboard-year-end-hot-100": billboardYearEndHot100,
  "billboard-hot-100-number-ones": billboardHot100NumberOnes,
  "pop-radio-year-end": popRadioYearEnd,
  "alternative-radio-year-end": alternativeRadioYearEnd,
  "trl-archive-top-ten": trlArchiveTopTen,
  "trl-number-one-videos": trlNumberOneVideos,
  "tophit-ru-annual-radio": tophitAnnualRadio,
  "tophit-ru-decade-release-year": tophitDecadeReleaseYear,
};

// ---------------------------------------------------------------------------
// Common sources — apply to every country
// ---------------------------------------------------------------------------
export const COMMON_SOURCES = {
  ranking: [],
  enrichment: ["lastfm-listener-enrichment"],
};

// ---------------------------------------------------------------------------
export const COUNTRY_SOURCE_SETS = {
  USA: [
    {
      from: 1990,
      to: 1997,
      weights: {
        "billboard-year-end-hot-100": 0.35,
        "pop-radio-year-end": 0.25,
        "alternative-radio-year-end": 0.25,
        "billboard-hot-100-number-ones": 0.15,
      },
    },
    {
      from: 1998,
      to: 2007,
      weights: {
        "billboard-year-end-hot-100": 0.25,
        "pop-radio-year-end": 0.20,
        "alternative-radio-year-end": 0.25,
        "trl-archive-top-ten": 0.20,
        "trl-number-one-videos": 0.05,
        "billboard-hot-100-number-ones": 0.05,
      },
    },
  ],
  RUS: [
    {
      from: 2003,
      to: 2007,
      weights: {
        "tophit-ru-annual-radio": 0.75,
        "tophit-ru-decade-release-year": 0.25,
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// sourcePlanFor(iso, year)
// ---------------------------------------------------------------------------

/**
 * Return the source plan for a country/year pair.
 *
 * @param {string} iso  Country ISO code (e.g. "USA", "RUS").
 * @param {number} year
 * @returns {{ iso: string, year: number, weights: Record<string, number>, rankingSources: string[], enrichmentSources: string[] }}
 * @throws {Error} NO_SOURCE_PLAN when no country range matches.
 */
export function sourcePlanFor(iso, year) {
  const ranges = COUNTRY_SOURCE_SETS[iso];
  if (!ranges) throw new Error(`NO_SOURCE_PLAN ${iso} ${year}`);

  for (const range of ranges) {
    if (year >= range.from && year <= range.to) {
      const weights = range.weights;

      // rankingSources = common ranking + weighted source keys, first-seen order
      const rankingSources = [];
      const seen = new Set();
      for (const src of COMMON_SOURCES.ranking) {
        if (!seen.has(src)) {
          rankingSources.push(src);
          seen.add(src);
        }
      }
      for (const src of Object.keys(weights)) {
        if (!seen.has(src)) {
          rankingSources.push(src);
          seen.add(src);
        }
      }

      return {
        iso,
        year,
        weights,
        rankingSources,
        enrichmentSources: COMMON_SOURCES.enrichment,
      };
    }
  }

  throw new Error(`NO_SOURCE_PLAN ${iso} ${year}`);
}

// ---------------------------------------------------------------------------
// collectSourceSignals(iso, year)
// ---------------------------------------------------------------------------

/**
 * Collect all ranking SourceSignal[] for a country/year by calling every
 * adapter named in the source plan.
 *
 * @param {string} iso
 * @param {number} year
 * @returns {Promise<import("./source-adapters.mjs").SourceSignal[]>}
 */
export async function collectSourceSignals(iso, year) {
  const plan = sourcePlanFor(iso, year);
  const results = [];

  for (const sourceId of plan.rankingSources) {
    const adapter = SOURCE_ADAPTERS[sourceId];
    if (!adapter) {
      throw new Error(`NO_SOURCE_ADAPTER ${sourceId}`);
    }
    const signals = await adapter({ iso, year });
    results.push(...signals);
  }

  return results;
}

// ---------------------------------------------------------------------------
// enrichDryRunRows(rows, options)
// ---------------------------------------------------------------------------

/**
 * Apply enrichment-only adapters (e.g. Last.fm) to dry-run output rows.
 * Returns rows unchanged unless options.withLastfm is true.
 *
 * @param {any[]} rows
 * @param {{ withLastfm?: boolean }} [options]
 * @returns {Promise<any[]>}
 */
export async function enrichDryRunRows(rows, options = {}) {
  if (!options.withLastfm) return rows;

  if (!process.env.LASTFM_API_KEY) {
    throw new Error("LASTFM_API_KEY is required for --with-lastfm");
  }

  return lastfmListenerEnrichment(rows);
}
