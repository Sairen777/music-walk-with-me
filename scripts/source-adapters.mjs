/**
 * Source-specific fetch/parse adapters for historical music chart data.
 *
 * Every ranking adapter returns SourceSignal[] for a given { iso, year }.
 * Unsupported countries/years return [] — they never throw unless the source
 * is selected by the registry for a country/year and the fetch/parse fails.
 *
 * @typedef {{ source: string, iso: string, year: number, artist: string, title: string, rank: number, rawScore: number, url: string, meta?: Record<string, string | number> }} SourceSignal
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import { trackKey } from "./music-normalize.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, "../.cache/source-cache");

// ── shared fetch helper ──────────────────────────────────────────────

/**
 * Fetch URL text with file-system caching.
 *
 * Default: use cache when present.  When MWWM_REFRESH_SOURCES=1, refetch
 * always; if refetch fails and a cache file exists, print a warning and
 * return the stale cache.  If no cache exists and the fetch fails, throw.
 */
async function fetchCachedText(url, cacheKey, source) {
  const cacheFile = resolve(CACHE_DIR, `${cacheKey}.txt`);
  const refresh = process.env.MWWM_REFRESH_SOURCES === "1";

  if (!refresh) {
    try {
      return await readFile(cacheFile, "utf8");
    } catch {
      /* cache miss — fetch below */
    }
  }

  let text;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch (err) {
    if (refresh) {
      try {
        const cached = await readFile(cacheFile, "utf8");
        process.stderr.write(`SOURCE WARN ${source} using stale cache\n`);
        return cached;
      } catch {
        /* no stale cache to fall back on */
      }
    }
    throw err;
  }

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFile, text, "utf8");
  return text;
}

// ── parse helpers (exported for tests) ───────────────────────────────

/**
 * Parse the first wikitable on a Billboard Year-End Hot 100 Wikipedia page.
 * Returns an array of { rank, artist, title } objects.
 */
export function parseBillboardYearEndHtml(html) {
  const tableRe = /<table[^>]*class="wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/i;
  const tableMatch = html.match(tableRe);
  if (!tableMatch) return [];

  const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  const results = [];

  for (const row of rows) {
    const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
    if (!cells || cells.length < 3) continue;

    const rankText = cells[0].replace(/<[^>]+>/g, "").trim();
    const rank = parseInt(rankText, 10);
    if (isNaN(rank)) continue;

    // Title: first anchor text in second cell
    const titleCell = cells[1];
    const titleMatch = titleCell.match(/<a\b[^>]*>([^<]+)<\/a>/);
    if (!titleMatch) continue;
    const title = titleMatch[1]
      .replace(/&amp;/g, "&")
      .replace(/&#0?39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();

    // Artist: first anchor text in third cell
    const artistCell = cells[2];
    const artistMatch = artistCell.match(/<a\b[^>]*>([^<]+)<\/a>/);
    if (!artistMatch) continue;
    const artist = artistMatch[1]
      .replace(/&amp;/g, "&")
      .replace(/&#0?39;/g, "'")
      .trim();

    results.push({ rank, artist, title });
  }

  return results;
}

/**
 * Parse a popradiotop20.com year-end HTML page.
 * Returns an array of { rank, artist, title } objects.
 */
export function parsePopRadioYearEndHtml(html) {
  // Normalize whitespace in the HTML so multiline tags don't break matching
  const normalized = html.replace(/\s+/g, " ").replace(/>\s+</g, "><");

  // Find each TR block, then extract two-TD rows from within
  const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  const results = [];
  let trMatch;

  while ((trMatch = trRe.exec(normalized)) !== null) {
    const trContent = trMatch[1];
    // Find all TD cells in this row
    const tdCells = trContent.match(/<td\b[^>]*>([\s\S]*?)<\/td>/gi);
    if (!tdCells || tdCells.length !== 2) continue;

    // Extract rank from first cell — strip all HTML tags
    const rankText = tdCells[0].replace(/<[^>]+>/g, "").trim();
    const rank = parseInt(rankText, 10);
    if (isNaN(rank)) continue;

    const content = tdCells[1];

    // Extract artist from <b> tags
    const boldMatch = content.match(/<b[^>]*>([^<]+)<\/b>/);
    if (!boldMatch) continue;
    const artist = boldMatch[1]
      .replace(/&amp;/g, "&")
      .replace(/&#0?39;/g, "'")
      .trim();

    // Title is everything after the last </b>
    const afterBold = content.replace(/.*<\/b>/s, "");
    const title = afterBold
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#0?39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    if (!title) continue;

    results.push({ rank, artist, title });
  }

  return results;
}

/**
 * Parse a popradiotop20.com alternative/modern-rock year-end HTML page.
 *
 * Two orientations are supported because the site layout changed over time:
 *   "title-artist" — <b> contains title, text after </b> is artist
 *   "artist-title" — <b> contains artist, text after </b> is title
 *
 * Returns an array of { rank, artist, title } objects.
 */
export function parseAlternativeRadioYearEndHtml(html, orientation) {
  const normalized = html.replace(/\s+/g, " ").replace(/>\s+</g, "><");

  const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  const results = [];
  let trMatch;

  while ((trMatch = trRe.exec(normalized)) !== null) {
    const trContent = trMatch[1];
    const tdCells = trContent.match(/<td\b[^>]*>([\s\S]*?)<\/td>/gi);
    if (!tdCells || tdCells.length < 2) continue;

    const rankText = tdCells[0].replace(/<[^>]+>/g, "").trim();
    const rank = parseInt(rankText, 10);
    if (isNaN(rank)) continue;

    const content = tdCells[1];

    const boldMatch = content.match(/<b[^>]*>([^<]+)<\/b>/);
    if (!boldMatch) continue;
    const boldText = boldMatch[1]
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#0?39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    const afterBold = content.replace(/.*<\/b>/s, "");
    const afterBoldText = afterBold
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/g, "&")
      .replace(/&#0?39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    if (!boldText || !afterBoldText) continue;

    const artist = orientation === "title-artist" ? afterBoldText : boldText;
    const title = orientation === "title-artist" ? boldText : afterBoldText;

    results.push({ rank, artist, title });
  }

  return results;
}

/**
 * Parse a Classic ATRL TRL monthly recap page (raw HTML text).
 * Returns an array of { rank, artist, title, points } objects from the
 * Top Ten / Recap sections.
 */
export function parseTrlRecapText(html) {
  // Preserve line breaks from <br> before stripping other tags
  let text = html.replace(/<br\s*\/?>/gi, "\n");
  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/g, "&").replace(/&#0?39;/g, "'");

  // Split into lines
  const lines = text.split(/\n/);
  const results = [];
  let inSection = false;
  const sectionHeaders = /^(?:Top\s*Ten|Recap|January|February|March|April|May|June|July|August|September|October|November|December)\b/i;
  const stopHeaders = /^(?:On\s*Deck|Falloffs|Notes|Video\s*Premiere|TRL\s*First\s*Look|Date:|Day:|Host:|Guest:)\b/i;

  // Rank line regex: NN.Artist - Title (notes) or NN-Artist - Title (notes)
  // Artist may contain "f/", "feat.", "&", etc. Title stops before parenthetical day/peak note.
  const rankRe = /^(\d{1,2})[.\-]\s*(.+?)\s+-\s+(.+?)(?:\s*\([^)]*(?:Day|Peak|DEBUT|RETURN)[^)]*\))?\s*$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for section headers
    if (sectionHeaders.test(trimmed)) {
      inSection = true;
      continue;
    }

    // Check for stop headers
    if (stopHeaders.test(trimmed)) {
      inSection = false;
      continue;
    }

    if (!inSection) continue;

    // Try to parse a rank line
    const m = trimmed.match(rankRe);
    if (!m) continue;

    const rank = parseInt(m[1], 10);
    if (isNaN(rank) || rank < 1 || rank > 10) continue;
    const artist = m[2].trim();
    let title = m[3].trim();
    // Strip trailing parenthetical with day/peak info
    title = title.replace(/\s*\([^)]*(?:Day|Peak|DEBUT|RETURN)[^)]*\)\s*$/, "").trim();
    if (!artist || !title) continue;
    results.push({ rank, artist, title, points: 11 - rank });
  }

  return results;
}

/**
 * Parse the Wikipedia TRL number-one videos page.
 * Returns an array of { artist, title, daysAtOne } for the given year.
 */
export function parseTrlNumberOneVideosHtml(html, year) {
  // Find the year heading: <h2 id="YEAR"> or <h3 id="YEAR">
  const headingRe = new RegExp(`<h[23][^>]*id="${year}"[^>]*>`, "i");
  const headingMatch = html.match(headingRe);
  if (!headingMatch) return [];

  // Get the HTML from the year heading onward
  const afterYear = html.slice(headingMatch.index);

  // Find the first wikitable after this heading
  const tableRe = /<table[^>]*class="wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/i;
  const tableMatch = afterYear.match(tableRe);
  if (!tableMatch) return [];

  const rows = tableMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  const keyInfo = new Map(); // trackKey → { artist, title, daysAtOne }

  for (const row of rows) {
    const cells = row.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
    if (!cells || cells.length < 3) continue;

    const dateText = cells[0].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!dateText || /^Date$/i.test(dateText)) continue; // skip header

    // Song from second cell — may have <a> link or be plain text; strip quotes
    const songCell = cells[1];
    const songLinkMatch = songCell.match(/<a\b[^>]*>([^<]+)<\/a>/);
    let title = (songLinkMatch ? songLinkMatch[1] : songCell.replace(/<[^>]+>/g, ""))
      .replace(/&amp;/g, "&")
      .replace(/&#0?39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim()
      .replace(/^["\u201C\u201D\u0022]+|["\u201C\u201D\u0022]+$/g, "") // strip surrounding quotes
      .trim();
    if (!title) continue;

    // Artist from third cell
    const artistCell = cells[2];
    const artistLinkMatch = artistCell.match(/<a\b[^>]*>([^<]+)<\/a>/);
    const artist = (artistLinkMatch ? artistLinkMatch[1] : artistCell.replace(/<[^>]+>/g, ""))
      .replace(/&amp;/g, "&")
      .replace(/&#0?39;/g, "'")
      .trim();
    if (!artist) continue;

    // Parse days from date range: "January 3–4" or "January 3" or "January 3 – 4"
    let days = 1;
    const rangeRe = /([A-Z][a-z]+)\s+(\d{1,2})\s*(?:[–—\-]\s*|\s+to\s+)(?:([A-Z][a-z]+)\s+)?(\d{1,2})/i;
    const rangeMatch = dateText.match(rangeRe);
    if (rangeMatch) {
      const startDay = parseInt(rangeMatch[2], 10);
      const endDay = parseInt(rangeMatch[4], 10);
      if (!isNaN(startDay) && !isNaN(endDay) && endDay >= startDay) {
        days = endDay - startDay + 1;
        if (days > 14) days = 1; // safety cap
      }
    }

    const key = trackKey(artist, title);
    if (!keyInfo.has(key)) {
      keyInfo.set(key, { artist, title, daysAtOne: 0 });
    }
    keyInfo.get(key).daysAtOne += days;
  }

  return [...keyInfo.values()].filter((e) => e.daysAtOne > 0);
}

/**
 * Parse TopHit __NEXT_DATA__ and return the decoded JSON object.
 */
export function parseTophitCompressedPageData(html) {
  const match = html.match(
    /<script[^>]*id="__NEXT_DATA__"[^>]*type="application\/json"[^>]*>([^<]+)<\/script>/,
  );
  if (!match) throw new Error("No __NEXT_DATA__ found on TopHit page");

  const nextData = JSON.parse(match[1]);
  const encoded = nextData.props?.pageProps?.data;
  if (!encoded) throw new Error("No pageProps.data in __NEXT_DATA__");

  const compressed = Buffer.from(encoded, "base64");
  const json = JSON.parse(inflateSync(compressed).toString("utf8"));
  return json;
}

// ── source adapters ──────────────────────────────────────────────────

/**
 * Billboard Year-End Hot 100 (USA, 1990-2007).
 * Fetches the Wikipedia year-end page and parses the first wikitable.
 */
export async function billboardYearEndHot100({ iso, year }) {
  if (iso !== "USA") return [];

  const url = `https://en.wikipedia.org/wiki/Billboard_Year-End_Hot_100_singles_of_${year}`;
  const cacheKey = `billboard-ye-${year}`;
  const html = await fetchCachedText(url, cacheKey, "billboard-year-end-hot-100");

  const rows = parseBillboardYearEndHtml(html);
  return rows.map((r) => ({
    source: "billboard-year-end-hot-100",
    iso: "USA",
    year,
    artist: r.artist,
    title: r.title,
    rank: r.rank,
    rawScore: (101 - r.rank) / 100,
    url,
  }));
}

/**
 * Billboard Hot 100 Number Ones (USA, 1990-2007).
 * Counts weeks at #1 from Wikipedia's list of number-one singles per year.
 */
export async function billboardHot100NumberOnes({ iso, year }) {
  if (iso !== "USA") return [];

  const url = `https://en.wikipedia.org/wiki/List_of_Billboard_Hot_100_number-one_singles_of_${year}`;
  const cacheKey = `billboard-no1-${year}`;
  const html = await fetchCachedText(url, cacheKey, "billboard-hot-100-number-ones");

  // Find the chart-table wikitable (skip the legend/key table)
  const tableRe = /<table[^>]*class="wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  let chartHTML = null;
  let tm;
  while ((tm = tableRe.exec(html)) !== null) {
    if (tm[1].includes("Issue date") || tm[1].includes("Song")) {
      chartHTML = tm[1];
      break;
    }
  }
  if (!chartHTML) return [];

  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const keyInfo = new Map();
  let currentArtist = null;
  let currentTitle = null;

  let rm;
  while ((rm = rowRe.exec(chartHTML)) !== null) {
    const rowHTML = rm[1];
    if (/<\/th>/i.test(rowHTML)) continue;

    const cells = rowHTML.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || [];

    // Rows with song/artist content have ≥ 4 cells (No. | Date | Song | Artist | Ref)
    // Continuation rows have 2 cells (Date | Ref — song/artist carried via rowspan)
    if (cells.length >= 4 && cells[2]) {
      // Parse song from cell index 2 — may have link or be plain text
      const songLink = cells[2].match(/<a\b[^>]*>([^<]+)<\/a>/);
      const songText = cells[2].replace(/<[^>]+>/g, "").trim();
      const rawTitle = songLink ? songLink[1] : songText;
      if (rawTitle) {
        currentTitle = rawTitle
          .replace(/&amp;/g, "&")
          .replace(/&#0?39;/g, "'")
          .replace(/&quot;/g, '"')
          .trim()
          .replace(/^["\u201C\u201D]+|["\u201C\u201D]+$/g, "")
          .replace(/\s*†$/, "");
      }
      // Parse artist from cell index 3 — may have link or be plain text
      if (cells[3]) {
        const artistLink = cells[3].match(/<a\b[^>]*>([^<]+)<\/a>/);
        const artistText = cells[3].replace(/<[^>]+>/g, "").trim();
        const artist = artistLink ? artistLink[1] : artistText;
        if (artist) {
          currentArtist = artist
            .replace(/&amp;/g, "&")
            .replace(/&#0?39;/g, "'")
            .trim();
        }
      }
    }

    if (!currentArtist || !currentTitle) continue;

    const key = trackKey(currentArtist, currentTitle);
    if (!keyInfo.has(key)) {
      keyInfo.set(key, { artist: currentArtist, title: currentTitle, weeks: 0 });
    }
    keyInfo.get(key).weeks += 1;
  }

  if (keyInfo.size === 0) return [];

  const sorted = [...keyInfo.values()].sort((a, b) => b.weeks - a.weeks);
  const maxWeeks = sorted[0].weeks;

  return sorted.map((entry, i) => ({
    source: "billboard-hot-100-number-ones",
    iso: "USA",
    year,
    artist: entry.artist,
    title: entry.title,
    rank: i + 1,
    rawScore: maxWeeks > 0 ? entry.weeks / maxWeeks : 0,
    url,
    meta: { weeksAtOne: entry.weeks },
  }));
}

/**
 * Pop Radio Year-End (USA, 1990-2007).
 * Fetches popradiotop20.com year-end charts.
 * URL mapping:
 *   1990-1994: RR-CHR-${year}-Year.htm
 *   1995-2005: RR-POP-${year}-Year.htm
 *   2006-2007: MB-POP-${year}.htm
 */
export async function popRadioYearEnd({ iso, year }) {
  if (iso !== "USA") return [];

  let filename;
  if (year >= 1990 && year <= 1994) {
    filename = `RR-CHR-${year}-Year.htm`;
  } else if (year >= 1995 && year <= 2005) {
    filename = `RR-POP-${year}-Year.htm`;
  } else if (year >= 2006 && year <= 2007) {
    filename = `MB-POP-${year}.htm`;
  } else {
    return [];
  }

  const url = `https://www.popradiotop20.com/Year/${filename}`;
  const cacheKey = `popradio-${year}`;
  const html = await fetchCachedText(url, cacheKey, "pop-radio-year-end");

  const rows = parsePopRadioYearEndHtml(html);
  return rows.map((r) => ({
    source: "pop-radio-year-end",
    iso: "USA",
    year,
    artist: r.artist,
    title: r.title,
    rank: r.rank,
    rawScore: (101 - r.rank) / 100,
    url,
  }));
}

/**
 * Alternative/Modern-Rock Radio Year-End (USA, 1990-2007).
 * Fetches popradiotop20.com alternative/modern-rock year-end charts.
 * URL mapping:
 *   1990-2000: MR-${year}-Yearly-Chart.htm  (title-artist orientation)
 *   2001-2005: Alt-${year}-Yearly-Chart-R.htm (title-artist orientation)
 *   2006-2007: Year/MB-ALT-${year}.htm        (artist-title orientation)
 */
export async function alternativeRadioYearEnd({ iso, year }) {
  if (iso !== "USA") return [];
  if (year < 1990 || year > 2007) return [];

  let url;
  let orientation;
  if (year >= 1990 && year <= 2000) {
    url = `https://www.popradiotop20.com/MR-${year}-Yearly-Chart.htm`;
    orientation = "title-artist";
  } else if (year >= 2001 && year <= 2005) {
    url = `https://www.popradiotop20.com/Alt-${year}-Yearly-Chart-R.htm`;
    orientation = "title-artist";
  } else {
    url = `https://www.popradiotop20.com/Year/MB-ALT-${year}.htm`;
    orientation = "artist-title";
  }

  const cacheKey = `alternative-radio-${year}`;
  const html = await fetchCachedText(url, cacheKey, "alternative-radio-year-end");

  const rows = parseAlternativeRadioYearEndHtml(html, orientation);
  return rows.slice(0, 100).map((r) => ({
    source: "alternative-radio-year-end",
    iso: "USA",
    year,
    artist: r.artist,
    title: r.title,
    rank: r.rank,
    rawScore: (101 - r.rank) / 100,
    url,
  }));
}

/**
 * MTV/TRL Monthly Top Ten (USA, 1998-2007).
 * Fetches Classic ATRL TRL archive monthly recaps and aggregates
 * appearances across months.
 */
export async function trlArchiveTopTen({ iso, year }) {
  if (iso !== "USA") return [];
  if (year < 1998 || year > 2007) return [];

  const startMonth = year === 1998 ? 9 : 1; // TRL began September 1998
  const aggregate = new Map(); // trackKey → { artist, title, totalPoints, appearances }

  for (let month = startMonth; month <= 12; month++) {
    const mm = String(month).padStart(2, "0");
    const url = `https://classic.atrl.net/trlarchive/index.php?s=recap&y=${year}&m=${mm}`;
    const cacheKey = `trl-${year}-${mm}`;

    let html;
    try {
      html = await fetchCachedText(url, cacheKey, "trl-archive-top-ten");
    } catch {
      // Some months may not have recaps — skip gracefully
      continue;
    }

    const entries = parseTrlRecapText(html);
    for (const e of entries) {
      const key = trackKey(e.artist, e.title);
      if (!aggregate.has(key)) {
        aggregate.set(key, { artist: e.artist, title: e.title, totalPoints: 0, appearances: 0 });
      }
      const agg = aggregate.get(key);
      agg.totalPoints += e.points;
      agg.appearances += 1;
    }
  }

  if (aggregate.size === 0) return [];

  const sorted = [...aggregate.values()].sort((a, b) => b.totalPoints - a.totalPoints);
  const maxAggregate = sorted[0].totalPoints;

  return sorted.map((entry, i) => ({
    source: "trl-archive-top-ten",
    iso: "USA",
    year,
    artist: entry.artist,
    title: entry.title,
    rank: i + 1,
    rawScore: maxAggregate > 0 ? entry.totalPoints / maxAggregate : 0,
    url: `https://classic.atrl.net/trlarchive/index.php?s=recap&y=${year}`,
    meta: { appearances: entry.appearances },
  }));
}

/**
 * MTV/TRL Number-One Videos (USA, 1998-2007).
 * Fetches Wikipedia's TRL number-one videos page and counts days at #1.
 */
export async function trlNumberOneVideos({ iso, year }) {
  if (iso !== "USA") return [];
  if (year < 1998 || year > 2007) return [];

  const url = "https://en.wikipedia.org/wiki/List_of_Total_Request_Live_number_one_music_videos";
  const cacheKey = "trl-number-one-videos";
  const html = await fetchCachedText(url, cacheKey, "trl-number-one-videos");

  const entries = parseTrlNumberOneVideosHtml(html, year);
  if (entries.length === 0) return [];

  const sorted = entries.sort((a, b) => b.daysAtOne - a.daysAtOne);
  const maxDays = sorted[0].daysAtOne;

  return sorted.map((entry, i) => ({
    source: "trl-number-one-videos",
    iso: "USA",
    year,
    artist: entry.artist,
    title: entry.title,
    rank: i + 1,
    rawScore: maxDays > 0 ? entry.daysAtOne / maxDays : 0,
    url,
    meta: { daysAtOne: entry.daysAtOne },
  }));
}

/**
 * TopHit Annual Radio Chart (Russia, 2003-2007).
 */
export async function tophitAnnualRadio({ iso, year }) {
  if (iso !== "RUS") return [];
  if (year < 2003 || year > 2007) return [];
  const cacheKey = `tophit-annual-${year}`;
  const url = `https://tophit.com/chart/top/radio/hits/ru/annual/${year}`;
  const html = await fetchCachedText(url, cacheKey, "tophit-ru-annual-radio");

  const data = parseTophitCompressedPageData(html);
  const charts = data.charts || [];
  if (charts.length === 0) return [];
  // charts is directly an array of chart-entry objects
  const rows = charts;
  if (!Array.isArray(rows)) return [];

  return rows.slice(0, 100).map((row) => {
    const track = row.track || {};
    // Build artist from track.artists array
    let artist = "";
    if (Array.isArray(track.artists) && track.artists.length > 0) {
      artist = track.artists
        .map((a) => a.intlName || a.name || "")
        .filter(Boolean)
        .join(", ");
    }
    if (!artist && track.artist) artist = track.artist;

    const title = track.intlName || track.name || "";

    return {
      source: "tophit-ru-annual-radio",
      iso: "RUS",
      year,
      artist,
      title,
      rank: row.position || 0,
      rawScore: (101 - (row.position || 0)) / 100,
      url,
    };
  }).filter((s) => s.artist && s.title && s.rank > 0);
}

/**
 * TopHit Decade Release-Year Filter (Russia, 2003-2007).
 * Fetches the 2000s decade chart and filters to tracks released in the requested year.
 */
export async function tophitDecadeReleaseYear({ iso, year }) {
  if (iso !== "RUS") return [];
  if (year < 2000 || year > 2007) return [];

  const url = "https://tophit.com/chart/top/radio/hits/ru/decade/2000";
  const cacheKey = "tophit-decade-2000";
  const html = await fetchCachedText(url, cacheKey, "tophit-ru-decade-release-year");

  const data = parseTophitCompressedPageData(html);
  const charts = data.charts || [];
  if (charts.length === 0) return [];

  const rows = charts;
  if (!Array.isArray(rows)) return [];

  // Filter to tracks whose release year matches
  const filtered = rows.filter((row) => {
    const track = row.track || {};
    if (track.releaseDate) {
      const releaseYear = new Date(track.releaseDate).getUTCFullYear();
      return releaseYear === year;
    }
    return false;
  });

  if (filtered.length === 0) return [];

  return filtered.map((row, i) => {
    const track = row.track || {};
    let artist = "";
    if (Array.isArray(track.artists) && track.artists.length > 0) {
      artist = track.artists
        .map((a) => a.intlName || a.name || "")
        .filter(Boolean)
        .join(", ");
    }
    if (!artist && track.artist) artist = track.artist;

    const title = track.intlName || track.name || "";

    return {
      source: "tophit-ru-decade-release-year",
      iso: "RUS",
      year,
      artist,
      title,
      rank: i + 1,
      rawScore: (filtered.length + 1 - (i + 1)) / filtered.length,
      url,
    };
  }).filter((s) => s.artist && s.title);
}

/**
 * Last.fm listener enrichment (dry-run only).
 * Requires LASTFM_API_KEY env var. Appends lastfm.listeners and
 * lastfm.playcount fields to candidate rows. Does not change ranking.
 */
export async function lastfmListenerEnrichment(candidates) {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) {
    throw new Error("LASTFM_API_KEY is required for --with-lastfm");
  }

  const cacheDir = resolve(CACHE_DIR, "lastfm");
  await mkdir(cacheDir, { recursive: true });

  const enriched = [];
  for (const c of candidates) {
    const term = `${c.artist} ${c.title}`;
    const cacheKey = term.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 80);
    const cacheFile = resolve(cacheDir, `${cacheKey}.json`);

    let info = null;
    try {
      info = JSON.parse(await readFile(cacheFile, "utf8"));
    } catch {
      try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${apiKey}&artist=${encodeURIComponent(c.artist)}&track=${encodeURIComponent(c.title)}&format=json`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        info = await res.json();
        await writeFile(cacheFile, JSON.stringify(info, null, 2), "utf8");
      } catch (err) {
        info = { error: err.message };
      }
    }

    const trackInfo = info?.track;
    const row = { ...c };
    row.lastfm = {
      listeners: trackInfo?.listeners ? parseInt(trackInfo.listeners, 10) || 0 : 0,
      playcount: trackInfo?.playcount ? parseInt(trackInfo.playcount, 10) || 0 : 0,
    };
    enriched.push(row);
  }

  return enriched;
}
