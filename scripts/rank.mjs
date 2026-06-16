/**
 * Weighted multi-source ranker for capsule seed candidates.
 *
 * Exports:
 *   buildRankedSeeds(filter?) → [{ iso, countryName, year, era, field, blurb, targetTracks, tracks }]
 *   scoreSignals(signals, weights) → [{ artist, title, score, sources, bestRank }]
 *
 * CLI:
 *   node scripts/rank.mjs --dry-run USA 2005          print top 40 as JSON
 *   node scripts/rank.mjs --dry-run USA 2005 --with-lastfm   include lastfm enrichment
 */

import { trackKey } from "./music-normalize.mjs";
import { capsuleConfig } from "./capsule-config.mjs";
import {
  sourcePlanFor,
  collectSourceSignals,
  enrichDryRunRows,
} from "./source-registry.mjs";

// Sources whose tracks are classified as punk/rock/alternative for genre boosting.
const ROCK_SOURCES = new Set(["alternative-radio-year-end"]);

// Score multiplier for rock-tagged tracks — tuned to get ~65% rock in the top 20.
const ROCK_BOOST = 1.8;


/**
 * Group signals by normalized track identity, sum weighted scores, add a
 * source-diversity bonus, and return a ranked array.
 *
 * @param {import("./source-adapters.mjs").SourceSignal[]} signals
 * @param {Record<string, number>} weights  source-id → weight
 * @returns {{ artist: string, title: string, score: number, sources: string[], bestRank: number }[]}
 */
export function scoreSignals(signals, weights) {
  // Only signals whose source appears in weights contribute to ranking.
  const eligible = signals.filter((s) => s.source in weights);

  // Group by trackKey
  const groups = new Map();
  for (const s of eligible) {
    const key = trackKey(s.artist, s.title);
    let group = groups.get(key);
    if (!group) {
      group = [];
      groups.set(key, group);
    }
    group.push(s);
  }

  const results = [];
  for (const [, sigs] of groups) {
    let score = 0;
    const weightedSources = new Set();
    let bestRank = Infinity;
    let bestSource = null;
    let bestSourceWeight = -Infinity;

    for (const s of sigs) {
      const w = weights[s.source] ?? 0;
      score += s.rawScore * w;
      if (w > 0) weightedSources.add(s.source);
      if (s.rank < bestRank) {
        bestRank = s.rank;
      }
    }

    // Diversity bonus: each additional distinct weighted source adds 0.05,
    // capped at 0.15 (so 4+ sources all earn the cap).
    const distinctCount = weightedSources.size;
    const diversityBonus = Math.min(0.15, 0.05 * (distinctCount - 1));

    // Genre boost: rock-tagged tracks get a multiplier.
    const tags = [];
    for (const src of weightedSources) {
      if (ROCK_SOURCES.has(src)) tags.push("rock");
    }
    if (tags.length > 0) {
      score += diversityBonus;
      score *= ROCK_BOOST;
    } else {
      score += diversityBonus;
    }

    // Display artist/title from the highest-weight source that contributed;
    // tie-break by best rank.
    let displayArtist = sigs[0].artist;
    let displayTitle = sigs[0].title;
    let pickWeight = weights[sigs[0].source] ?? 0;
    let pickRank = sigs[0].rank;
    for (const s of sigs) {
      const w = weights[s.source] ?? 0;
      if (w > pickWeight || (w === pickWeight && s.rank < pickRank)) {
        displayArtist = s.artist;
        displayTitle = s.title;
        pickWeight = w;
        pickRank = s.rank;
      }
    }

    results.push({
      artist: displayArtist,
      title: displayTitle,
      score,
      sources: [...weightedSources].sort(),
      bestRank,
      tags,
    });
  }

  // Sort: score desc → source count desc → best rank asc → artist asc → title asc
  results.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    if (a.sources.length !== b.sources.length) return b.sources.length - a.sources.length;
    if (a.bestRank !== b.bestRank) return a.bestRank - b.bestRank;
    const artCmp = a.artist.localeCompare(b.artist);
    if (artCmp !== 0) return artCmp;
    return a.title.localeCompare(b.title);
  });

  return results;
}

// ---------------------------------------------------------------------------
// buildRankedSeeds(filter?)
// ---------------------------------------------------------------------------

/**
 * Build ranked candidate queues for every configured country/year (or a
 * single one when `filter.iso` / `filter.year` is provided).
 *
 * Returns an array of objects compatible with the EraSeed handoff used by
 * hydrate.mjs — `tracks` is a queue of `{ artist, title }` pairs.
 *
 * @param {{ iso?: string, year?: number }} [filter]
 * @returns {Promise<{ iso: string, countryName: string, year: number, era: string, field: string, blurb: string, targetTracks: number, tracks: { artist: string, title: string }[] }[]>}
 */
export async function buildRankedSeeds(filter = {}) {
  const results = [];

  for (const capsule of capsuleConfig) {
    if (filter.iso && capsule.iso !== filter.iso) continue;

    for (const [yearStr, meta] of Object.entries(capsule.years)) {
      const year = parseInt(yearStr, 10);
      if (filter.year != null && year !== filter.year) continue;

      const plan = sourcePlanFor(capsule.iso, year);
      const signals = await collectSourceSignals(capsule.iso, year);
      const scored = scoreSignals(signals, plan.weights);

      results.push({
        iso: capsule.iso,
        countryName: capsule.countryName,
        year,
        era: meta.era,
        field: meta.field,
        blurb: meta.blurb,
        targetTracks: capsule.targetTracks,
        tracks: scored.map((s) => ({ artist: s.artist, title: s.title, tags: s.tags })),
        artifacts: meta.artifacts,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("rank.mjs") || process.argv[1].includes("/rank.mjs"));

if (isMain) {
  const args = process.argv.slice(2);

  if (args.includes("--dry-run")) {
    const dryIdx = args.indexOf("--dry-run");
    const iso = args[dryIdx + 1];
    const yearStr = args[dryIdx + 2];
    const withLastfm = args.includes("--with-lastfm");

    if (!iso || yearStr == null) {
      console.error("Usage: node scripts/rank.mjs --dry-run <ISO> <YEAR> [--with-lastfm]");
      process.exit(1);
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) {
      console.error(`Invalid year: ${yearStr}`);
      process.exit(1);
    }

    const plan = sourcePlanFor(iso, year);
    const signals = await collectSourceSignals(iso, year);
    let rows = scoreSignals(signals, plan.weights).slice(0, 40);

    if (withLastfm) {
      rows = await enrichDryRunRows(rows, { withLastfm: true });
    }

    console.log(JSON.stringify(rows, null, 2));
  }
}
