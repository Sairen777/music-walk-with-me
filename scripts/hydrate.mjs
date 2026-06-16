/**
 * Build-time hydration: rank candidates from historical sources, resolve
 * the top-ranked tracks to real iTunes artwork + 30s previews, then write
 * per-country shard files + a tiny index to public/data/ (the app fetches
 * one country file on demand).
 *
 * Run: npm run data   (or: node scripts/hydrate.mjs)
 * No API key needed for default generation. Be polite to iTunes (throttled below).
 */
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { norm, slug, coreOf, canonicalName, leadArtistKey, trackKey } from "./music-normalize.mjs";
import { buildRankedSeeds } from "./rank.mjs";
import { enrichArtifacts, validateEnrichedArtifacts } from "./artifact-media.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/data");
const TRACK_CACHE = resolve(__dirname, "../.cache/itunes-track-cache.json");
const HERO_YEAR_BY_ISO = { USA: 2005, RUS: 2006 };
const STOREFRONTS_BY_ISO = { USA: ["US"], RUS: ["RU", "US"] };
const ENDPOINT = "https://itunes.apple.com/search";

const BAD =
  /\b(live|remix|karaoke|cover|tribute|instrumental|made famous|originally performed|as made|acoustic|re-?recorded|re-?mastered live|sped up|slowed|8 bit|8-bit|lullaby|piano version|tribute to|in the style of|workout|hardstyle)\b/i;

/** Collection names that signal a non-original cover / comp / soundtrack with worse art. */
const COMP =
  /\b(now thats|now that s|kidz bop|punk goes|emo bangers|\bemo\b|feelgood|classic rock|pop punk|love songs|bad news|various|greatest hits|the hits|number ones|essentials?|speed pop|pop party|party hits|workout|running|throwbacks?|\d{2,4}s hits|hits of|best of the|ultimate|mega ?hits|compilation|playlist|karaoke|tribute|guitar tribute|string quartet|made famous|originally performed|as made famous|soundtrack|drum and bass|covers? of|in the style|road trip)\b/i;


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(term, country = "US") {
  const url = `${ENDPOINT}?term=${encodeURIComponent(term)}&media=music&entity=song&limit=25&country=${country}`;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url);
    if (res.status === 403 || res.status === 429) {
      await sleep(3000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`iTunes ${res.status} for "${term}"`);
    const json = await res.json();
    return json.results ?? [];
  }
  throw new Error(`iTunes throttled for "${term}"`);
}

function bestMatch(results, artist, title) {
  const at = canonicalName(artist);
  const tt = norm(title);
  // Strip parenthetical qualifiers from the seed title for looser comparison.
  const ttCore = coreOf(title);
  let best = null;
  let bestScore = -Infinity;

  for (const r of results) {
    if (r.kind !== "song" || !r.previewUrl) continue;
    const ra = canonicalName(r.artistName);
    // Treat "(Album Version)" / "(Single Version)" etc. as the canonical title.
    const rt = norm(r.trackName.replace(/\((?:album|single|lp|stereo|original|mono|mixed|remaster(?:ed)?)(?: version)?\)/gi, " "));
    const rtCore = coreOf(r.trackName);

    // Artist must overlap. A same-title track by the wrong act (a cover, an
    // instrumental "string quartet" tribute, a coincidental namesake) is worse
    // than a miss, so disqualify any candidate with no artist overlap.
    let artistScore = 0;
    if (ra === at) artistScore = 4;
    else if (ra.includes(at) || at.includes(ra)) artistScore = 2;
    if (artistScore === 0) continue;

    let score = artistScore;
    if (rt === tt) score += 5;
    else if (rtCore === ttCore && ttCore) score += 4;
    else if (rt.includes(ttCore) || ttCore.includes(rtCore)) score += 2;

    if (BAD.test(r.trackName) || BAD.test(r.collectionName ?? "")) score -= 6;
    // Soft penalties: a real studio album always outranks a comp/various-artists
    // release of the same recording, but a comp is still used when it's the only
    // previewable source (better the right song with plain art than a miss).
    if (COMP.test(r.collectionName ?? "")) score -= 3;
    if (norm(r.collectionArtistName ?? "") === "various artists") score -= 3;
    // A clean studio single beats a deluxe/anniversary re-issue, slightly.
    if (/\b(deluxe|anniversary|expanded)\b/i.test(r.collectionName ?? "")) score -= 1;

    // iTunes returns the canonical album first by relevance, so among equal
    // scores the first-seen result wins; comps are demoted by the penalties above.
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  // Require artist overlap (>=2) plus a real title signal (>=2): floor of 4.
  return bestScore >= 6 ? best : null;
}

function hydrateTrack(r) {
  return {
    id: `${slug(r.artistName)}--${slug(r.trackName)}`,
    artist: r.artistName,
    title: r.trackName.replace(/\s*\((?:album|single|lp|stereo|original|mono|mixed|remaster(?:ed)?)(?: version)?\)\s*$/i, ""),
    album: r.collectionName ?? "",
    artworkUrl: (r.artworkUrl100 ?? r.artworkUrl60 ?? "").replace(
      /\/\d+x\d+bb\.(jpg|png)$/,
      "/600x600bb.$1",
    ),
    previewUrl: r.previewUrl,
    releaseYear: r.releaseDate ? new Date(r.releaseDate).getUTCFullYear() : 0,
    durationMs: r.trackTimeMillis ?? 0,
  };
}

async function loadExistingTrackCache() {
  const byId = new Map();

  try {
    const persisted = JSON.parse(await readFile(TRACK_CACHE, "utf8"));
    for (const track of persisted) byId.set(track.id, track);
  } catch {
    // First run on a repo without a cache: fall through to shard bootstrap.
  }

  try {
    const index = JSON.parse(await readFile(resolve(OUT_DIR, "index.json"), "utf8"));
    for (const entry of index) {
      const country = JSON.parse(await readFile(resolve(OUT_DIR, `${entry.iso}.json`), "utf8"));
      for (const capsule of country) {
        for (const track of capsule.tracks ?? []) byId.set(track.id, track);
      }
    }
  } catch {
    // No shards yet.
  }

  return [...byId.values()];
}

async function saveTrackCache(tracks) {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(TRACK_CACHE, JSON.stringify(tracks, null, 2) + "\n", "utf8");
}

function bestCachedMatch(cache, artist, title) {
  const at = canonicalName(artist);
  const tt = norm(title);
  const ttCore = coreOf(title);
  let best = null;
  let bestScore = -Infinity;

  for (const r of cache) {
    const ra = canonicalName(r.artist);
    const rt = norm(r.title.replace(/\((?:album|single|lp|stereo|original|mono|mixed|remaster(?:ed)?)(?: version)?\)/gi, " "));
    const rtCore = coreOf(r.title);

    let artistScore = 0;
    if (ra === at) artistScore = 4;
    else if (ra.includes(at) || at.includes(ra)) artistScore = 2;
    if (artistScore === 0) continue;

    let score = artistScore;
    if (rt === tt) score += 5;
    else if (rtCore === ttCore && ttCore) score += 4;
    else if (rt.includes(ttCore) || ttCore.includes(rtCore)) score += 2;

    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }

  return bestScore >= 6 ? best : null;
}

async function main() {
  const existing = await loadExistingTrackCache();
  if (existing.length) process.stdout.write(`Using ${existing.length} cached tracks from public/data\n`);

  const filterIso = process.argv.includes("--iso") ? process.argv[process.argv.indexOf("--iso") + 1] : null;
  const rankedSeeds = await buildRankedSeeds(filterIso ? { iso: filterIso } : {});
  const capsules = [];

  for (const seed of rankedSeeds) {
    const tracks = [];
    const seenIds = new Set();
    const seenKeys = new Set();
    const seenArtists = new Set();

    const storefronts = STOREFRONTS_BY_ISO[seed.iso] || ["US"];
    process.stdout.write(`\n${seed.countryName} ${seed.year} (target ${seed.targetTracks})\n`);

    for (const t of seed.tracks) {
      if (tracks.length >= seed.targetTracks) break;

      const candidateArtistKey = leadArtistKey(t.artist);
      const tKey = trackKey(t.artist, t.title);

      if (seenKeys.has(tKey)) continue;

      let hydrated = bestCachedMatch(existing, t.artist, t.title);
      if (hydrated) {
        if (seenIds.has(hydrated.id)) continue;
        const hydratedArtistKey = leadArtistKey(hydrated.artist);
        if (seenArtists.has(candidateArtistKey) || seenArtists.has(hydratedArtistKey)) continue;
        seenIds.add(hydrated.id);
        seenKeys.add(tKey);
        if (candidateArtistKey) seenArtists.add(candidateArtistKey);
        if (hydratedArtistKey) seenArtists.add(hydratedArtistKey);
        tracks.push(hydrated);
        process.stdout.write(`  ↺ ${hydrated.artist} - ${hydrated.title}\n`);
        continue;
      }

      const term = t.hint ?? `${t.artist} ${t.title}`;
      let match = null;
      try {
        for (const sf of storefronts) {
          match = bestMatch(await search(term, sf), t.artist, t.title);
          if (match) break;
        }
        if (!match) {
          const strippedTerm = `${t.artist} ${t.title.replace(/\s*\(.*?\)\s*/g, " ").trim()}`;
          for (const sf of storefronts) {
            match = bestMatch(await search(strippedTerm, sf), t.artist, t.title);
            if (match) break;
          }
        }
      } catch (err) {
        process.stdout.write(`  ! error ${t.artist} - ${t.title}: ${err.message}\n`);
      }

      if (!match) {
        process.stdout.write(`  · MISS  ${t.artist} - ${t.title}\n`);
        await sleep(320);
        continue;
      }

      hydrated = hydrateTrack(match);
      if (seenIds.has(hydrated.id)) {
        await sleep(320);
        continue;
      }
      const hydratedArtistKey = leadArtistKey(hydrated.artist);
      if (seenArtists.has(candidateArtistKey) || seenArtists.has(hydratedArtistKey)) {
        await sleep(320);
        continue;
      }
      seenIds.add(hydrated.id);
      seenKeys.add(tKey);
      if (candidateArtistKey) seenArtists.add(candidateArtistKey);
      if (hydratedArtistKey) seenArtists.add(hydratedArtistKey);
      tracks.push(hydrated);
      existing.push(hydrated);
      await saveTrackCache(existing);
      process.stdout.write(`  ✓ ${hydrated.artist} - ${hydrated.title}\n`);
      await sleep(320);
    }

    if (tracks.length < seed.targetTracks) {
      throw new Error(`UNDERFILLED ${seed.iso} ${seed.year}: wanted ${seed.targetTracks}, got ${tracks.length}`);
    }

    const artifacts = seed.artifacts
      ? await enrichArtifacts({ iso: seed.iso, year: seed.year, artifacts: seed.artifacts })
      : null;
    if (artifacts) validateEnrichedArtifacts({ iso: seed.iso, year: seed.year, artifacts });

    capsules.push({
      iso: seed.iso,
      countryName: seed.countryName,
      year: seed.year,
      era: seed.era,
      field: seed.field,
      blurb: seed.blurb,
      tracks,
      artifacts,
    });
  }

  // Shard by country: one file per ISO, plus a tiny index for the map.
  // Also include any pre-existing country shards that weren't regenerated.
  await mkdir(OUT_DIR, { recursive: true });
  const byCountry = new Map();
  for (const c of capsules) {
    if (!byCountry.has(c.iso)) byCountry.set(c.iso, []);
    byCountry.get(c.iso).push(c);
  }
  // Check for existing shard files not in this run
  for (const file of await readdir(OUT_DIR)) {
    if (!file.endsWith(".json") || file === "index.json") continue;
    const iso = file.replace(".json", "");
    if (!byCountry.has(iso)) {
      const list = JSON.parse(await readFile(resolve(OUT_DIR, file), "utf8"));
      byCountry.set(iso, list);
    }
  }
  const index = [];
  for (const [iso, list] of byCountry) {
    list.sort((a, b) => a.year - b.year);
    await writeFile(resolve(OUT_DIR, `${iso}.json`), JSON.stringify(list, null, 2) + "\n", "utf8");
    const heroYear = HERO_YEAR_BY_ISO[iso] && list.some((c) => c.year === HERO_YEAR_BY_ISO[iso])
      ? HERO_YEAR_BY_ISO[iso]
      : list[0].year;
    const hero = list.find((c) => c.year === heroYear);
    index.push({
      iso,
      countryName: list[0].countryName,
      years: list.map((c) => c.year),
      heroYear,
      heroTrack: hero?.tracks.find((t) => t.tags?.includes("rock")) || hero?.tracks[0],
    });
  }
  await writeFile(resolve(OUT_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");

  const total = capsules.reduce((n, c) => n + c.tracks.length, 0);
  process.stdout.write(
    `\nWrote ${total} tracks -> ${byCountry.size} country files + index.json in ${OUT_DIR}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
