/**
 * Build-time hydration: resolve every seed track to real iTunes artwork
 * + a 30s preview, then write per-country shard files + a tiny index to
 * public/data/ (the app fetches one country file on demand).
 *
 * Run: node scripts/hydrate.mjs
 * No API key, no auth. Be polite to the endpoint (throttled below).
 */
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { seeds } from "./seed.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../public/data");
const ENDPOINT = "https://itunes.apple.com/search";

const BAD =
  /\b(live|remix|karaoke|cover|tribute|instrumental|made famous|originally performed|as made|acoustic|re-?recorded|re-?mastered live|sped up|slowed|8 bit|8-bit|lullaby|piano version|tribute to|in the style of|workout|hardstyle)\b/i;

/** Collection names that signal a non-original cover / comp / soundtrack with worse art. */
const COMP =
  /\b(now thats|now that s|kidz bop|punk goes|emo bangers|\bemo\b|feelgood|classic rock|pop punk|love songs|bad news|various|greatest hits|the hits|number ones|essentials?|speed pop|pop party|party hits|workout|running|throwbacks?|\d{2,4}s hits|hits of|best of the|ultimate|mega ?hits|compilation|playlist|karaoke|tribute|guitar tribute|string quartet|made famous|originally performed|as made famous|soundtrack|drum and bass|covers? of|in the style|road trip)\b/i;

// Russian Cyrillic -> Latin so a Cyrillic seed matches whether iTunes returns
// the track in Cyrillic ("Звери") or transliterated ("Zveri"). Both sides run
// through this, so the scheme only has to be internally consistent.
const RU = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i",
  й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s",
  т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[\u0400-\u04ff]/g, (ch) => RU[ch] ?? "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slug = (s) =>
  norm(s)
    .replace(/\s+/g, "-")
    .slice(0, 60);

/** Title core: drop parenthetical/bracketed qualifiers, then normalize. */
const coreOf = (s) => norm(s.replace(/[([{][^)\]}]*[)\]}]/g, " "));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(term) {
  const url = `${ENDPOINT}?term=${encodeURIComponent(term)}&media=music&entity=song&limit=25&country=US`;
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
  const at = norm(artist);
  const tt = norm(title);
  // Strip parenthetical qualifiers from the seed title for looser comparison.
  const ttCore = coreOf(title);
  let best = null;
  let bestScore = -Infinity;

  for (const r of results) {
    if (r.kind !== "song" || !r.previewUrl) continue;
    const ra = norm(r.artistName);
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

async function main() {
  const capsules = [];
  const misses = [];

  for (const seed of seeds) {
    const tracks = [];
    const seen = new Set();
    process.stdout.write(`\n${seed.countryName} ${seed.year} (${seed.tracks.length} tracks)\n`);

    for (const t of seed.tracks) {
      const term = t.hint ?? `${t.artist} ${t.title}`;
      let match = null;
      try {
        match = bestMatch(await search(term), t.artist, t.title);
        // Retry with a tightened query if the broad one missed.
        if (!match) {
          match = bestMatch(await search(`${t.artist} ${t.title.replace(/\s*\(.*?\)\s*/g, " ").trim()}`), t.artist, t.title);
        }
      } catch (err) {
        process.stdout.write(`  ! error ${t.artist} - ${t.title}: ${err.message}\n`);
      }

      if (!match) {
        misses.push(`${seed.year}  ${t.artist} - ${t.title}`);
        process.stdout.write(`  · MISS  ${t.artist} - ${t.title}\n`);
        await sleep(320);
        continue;
      }

      const hydrated = hydrateTrack(match);
      if (seen.has(hydrated.id)) {
        await sleep(320);
        continue;
      }
      seen.add(hydrated.id);
      tracks.push(hydrated);
      process.stdout.write(`  ✓ ${hydrated.artist} - ${hydrated.title}\n`);
      await sleep(320);
    }

    capsules.push({
      iso: seed.iso,
      countryName: seed.countryName,
      year: seed.year,
      era: seed.era,
      field: seed.field,
      blurb: seed.blurb,
      tracks,
    });
  }

  // Shard by country: one file per ISO, plus a tiny index for the map.
  await mkdir(OUT_DIR, { recursive: true });
  const byCountry = new Map();
  for (const c of capsules) {
    if (!byCountry.has(c.iso)) byCountry.set(c.iso, []);
    byCountry.get(c.iso).push(c);
  }
  const index = [];
  for (const [iso, list] of byCountry) {
    list.sort((a, b) => a.year - b.year);
    await writeFile(resolve(OUT_DIR, `${iso}.json`), JSON.stringify(list, null, 2) + "\n", "utf8");
    index.push({ iso, countryName: list[0].countryName, years: list.map((c) => c.year) });
  }
  await writeFile(resolve(OUT_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");

  const total = capsules.reduce((n, c) => n + c.tracks.length, 0);
  process.stdout.write(
    `\nWrote ${total} tracks -> ${byCountry.size} country files + index.json in ${OUT_DIR}\n`,
  );
  if (misses.length) {
    process.stdout.write(`\n${misses.length} misses to fix in seed.mjs:\n${misses.map((m) => "  " + m).join("\n")}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
