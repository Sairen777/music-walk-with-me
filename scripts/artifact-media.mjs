/**
 * Build-time artifact media enricher: takes editorial label lists from
 * capsule-config and resolves each film/game/gadget to rich metadata
 * (posters, covers, screenshots, descriptions) via Wikipedia/Wikimedia.
 *
 * Run during `npm run data` only — never fetched by the runtime app.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = resolve(__dirname, "../.cache/artifact-media");

const KIND_FILM = "film";
const KIND_GAME = "game";
const KIND_GADGET = "gadget";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Simple concurrency-limited async map. */
async function mapLimit(items, fn, concurrency = 1) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

// ── Wikipedia title overrides for ambiguous / non-obvious labels ──────

/** @type {Record<string, Record<string, string>>} */
const WIKI_TITLE_OVERRIDES = {
  film: {
    "Ghost": "Ghost_(1990_film)",
    "Friday": "Friday_(1995_film)",
    "Scream": "Scream_(1996_film)",
    "Titanic": "Titanic_(1997_film)",
    "Blade": "Blade_(1998_film)",
    "Spider-Man": "Spider-Man_(2002_film)",
    "The 9th Company (9 рота)": "The_9th_Company",
    "Night Watch (Ночной дозор)": "Night_Watch_(2004_film)",
    "Day Watch (Дневной дозор)": "Day_Watch_(film)",
    "The Irony of Fate 2 (Ирония судьбы 2)": "The_Irony_of_Fate_2",
    "ЖARA": "Heat_(2006_film)",
    "Trainspotting": "Trainspotting_(film)",
    "Men in Black": "Men_in_Black_(1997_film)",
    "Rushmore": "Rushmore_(film)",
    "American Pie": "American_Pie_(film)",
    "Bring It On": "Bring_It_On_(film)",
    "8 Mile": "8_Mile_(film)",
    "Kill Bill: Vol. 1": "Kill_Bill:_Volume_1",
    "Casino Royale": "Casino_Royale_(2006_film)",
    "Borat": "Borat_(film)",
    "Juno": "Juno_(film)",
    "Брат 2": "Brother_2",
    "Бумер": "Bimmer_(film)",
    "Ночной базар": "Nochnoy_bazar",
    "Питер FM": "Piter_FM",
    "The Silence of the Lambs": "The_Silence_of_the_Lambs_(film)",
    "Dazed and Confused": "Dazed_and_Confused_(film)",
    "Clerks": "Clerks_(film)",
    "Wayne's World": "Wayne%27s_World_(film)",
    "Point Break": "Point_Break_(1991_film)",
    "Aladdin": "Aladdin_(1992_Disney_film)",
    "Space Jam": "Space_Jam",
    "Pulp Fiction": "Pulp_Fiction",
    "Forrest Gump": "Forrest_Gump",
    "Independence Day": "Independence_Day_(1996_film)",
    "The Matrix": "The_Matrix",
    "Gladiator": "Gladiator_(2000_film)",
    "Almost Famous": "Almost_Famous",
    "Shrek": "Shrek",
    "Donnie Darko": "Donnie_Darko",
    "The Fast and the Furious": "The_Fast_and_the_Furious_(2001_film)",
    "Finding Nemo": "Finding_Nemo",
    "School of Rock": "School_of_Rock",
    "Mean Girls": "Mean_Girls",
    "The Incredibles": "The_Incredibles",
    "Batman Begins": "Batman_Begins",
    "Superbad": "Superbad",
    "Knocked Up": "Knocked_Up",
    "No Country for Old Men": "No_Country_for_Old_Men",
    "Shaun of the Dead": "Shaun_of_the_Dead",
    "Napoleon Dynamite": "Napoleon_Dynamite",
    "Groundhog Day": "Groundhog_Day_(film)",
    "Jurassic Park": "Jurassic_Park",
    "Toy Story": "Toy_Story",
    "Good Will Hunting": "Good_Will_Hunting",
    "Saving Private Ryan": "Saving_Private_Ryan",
    "The Big Lebowski": "The_Big_Lebowski",
    "American Psycho": "American_Psycho_(film)",
    "Harry Potter and the Goblet of Fire": "Harry_Potter_and_the_Goblet_of_Fire_(film)",
    "Fight Club": "Fight_Club_(film)",
    "10 Things I Hate About You": "10_Things_I_Hate_About_You",
    "The Devil Wears Prada": "The_Devil_Wears_Prada_(film)",
    "Pan's Labyrinth": "Pan%27s_Labyrinth",
    "Bend It Like Beckham": "Bend_It_Like_Beckham",
    "Terminator 3": "Terminator_3:_Rise_of_the_Machines",
    "Transformers": "Transformers_(film)",
    "Spider-Man 3": "Spider-Man_3",
    "Pirates of the Caribbean: Dead Man's Chest": "Pirates_of_the_Caribbean:_Dead_Man%27s_Chest",
    "Pirates of the Caribbean": "Pirates_of_the_Caribbean:_The_Curse_of_the_Black_Pearl",
  },
  game: {
    "Call of Duty": "Call_of_Duty_(video_game)",
    "God of War": "God_of_War_(2005_video_game)",
    "Portal": "Portal_(video_game)",
    "Assassin's Creed": "Assassin%27s_Creed_(video_game)",
    "Counter-Strike 1.6": "Counter-Strike_(video_game)",
    "The Sims": "The_Sims_(video_game)",
    "Doom": "Doom_(1993_video_game)",
    "Myst": "Myst",
    "Command & Conquer": "Command_%26_Conquer_(1995_video_game)",
    "Tomb Raider": "Tomb_Raider_(1996_video_game)",
    "Resident Evil": "Resident_Evil_(1996_video_game)",
    "Half-Life": "Half-Life_(video_game)",
    "Halo: Combat Evolved": "Halo:_Combat_Evolved",
    "Halo 2": "Halo_2",
    "Halo 3": "Halo_3",
    "BioShock": "BioShock",
    "Call of Duty 4: Modern Warfare": "Call_of_Duty_4:_Modern_Warfare",
    "Crysis": "Crysis_(video_game)",
    "Warcraft III: The Frozen Throne": "Warcraft_III:_The_Frozen_Throne",
    "Half-Life 2": "Half-Life_2",
    "Need for Speed: Most Wanted": "Need_for_Speed:_Most_Wanted_(2005_video_game)",
    "Heroes of Might and Magic V": "Heroes_of_Might_and_Magic_V",
    "Mortal Kombat": "Mortal_Kombat_(1992_video_game)",
    "Grand Theft Auto III": "Grand_Theft_Auto_III",
    "Grand Theft Auto: Vice City": "Grand_Theft_Auto:_Vice_City",
    "Grand Theft Auto: San Andreas": "Grand_Theft_Auto:_San_Andreas",
    "Super Smash Bros. Melee": "Super_Smash_Bros._Melee",
    "Kingdom Hearts": "Kingdom_Hearts_(video_game)",
    "Star Wars: Knights of the Old Republic": "Star_Wars:_Knights_of_the_Old_Republic_(video_game)",
    "The Legend of Zelda: Ocarina of Time": "The_Legend_of_Zelda:_Ocarina_of_Time",
    "Metal Gear Solid": "Metal_Gear_Solid_(1998_video_game)",
    "World of Warcraft": "World_of_Warcraft",
    "The Elder Scrolls IV: Oblivion": "The_Elder_Scrolls_IV:_Oblivion",
    "Guitar Hero": "Guitar_Hero_(video_game)",
  },
  gadget: {
    "SNES": "Super_Nintendo_Entertainment_System",
    "PS1": "PlayStation_(console)",
    "PS3": "PlayStation_3",
    "iPod Nano 2G": "IPod_Nano",
    "iPod Video": "IPod",
    "iPod Touch": "IPod_Touch",
    "iPod Mini": "IPod_Mini",
    "AOL Instant Messenger": "AIM_(software)",
    "Nokia 6110 (Snake!)": "Nokia_6110",
    "CD-RW drive": "CD-RW",
    "IR port file swaps": "Infrared_Data_Association",
    "VKontakte": "VK_(service)",
    "Odnoklassniki": "Odnoklassniki",
    "Sega Genesis": "Sega_Genesis",
    "Sony Walkman": "Walkman",
    "Sega CD": "Sega_CD",
    "Motorola MicroTAC": "Motorola_MicroTAC",
    "Discman": "Discman",
    "Apple Newton": "Apple_Newton",
    "Sega Saturn (JP)": "Sega_Saturn",
    "Motorola StarTAC": "Motorola_StarTAC",
    "Sony PlayStation (JP)": "PlayStation_(console)",
    "Sony PlayStation (US)": "PlayStation_(console)",
    "Windows 95": "Windows_95",
    "Palm Pilot": "PalmPilot",
    "Nintendo 64": "Nintendo_64",
    "Tamagotchi": "Tamagotchi",
    "iMac G3": "IMac_G3",
    "Dreamcast (JP)": "Dreamcast",
    "Nokia 5110": "Nokia_5110",
    "Napster": "Napster",
    "Nokia 3210": "Nokia_3210",
    "Sega Dreamcast (US)": "Dreamcast",
    "PlayStation 2": "PlayStation_2",
    "Nokia 3310": "Nokia_3310",
    "iPod (1st gen)": "IPod",
    "Xbox": "Xbox_(console)",
    "Game Boy Advance": "Game_Boy_Advance",
    "iPod (touch wheel)": "IPod",
    "Xbox Live": "Xbox_network",
    "Sidekick": "Danger_Hiptop",
    "iPod (3rd gen)": "IPod",
    "Nokia N-Gage": "N-Gage_(device)",
    "Razer Diamondback": "Razer_Inc.",
    "Nintendo DS": "Nintendo_DS",
    "Motorola RAZR V3": "Motorola_RAZR_V3",
    "Motorola RAZR": "Motorola_RAZR",
    "iPod Video": "IPod",
    "Xbox 360": "Xbox_360",
    "Nintendo Wii": "Wii",
    "iPhone": "IPhone",
    "Siemens C55": "Siemens_Mobile",
    "Polyphonic ringtones": "Polyphonic_ringtone",
    "Nokia 6230": "Nokia_6230",
    "Sony Ericsson K750i": "Sony_Ericsson_K750",
    "ICQ": "ICQ",
    "Motorola RAZR V3i": "Motorola_RAZR_V3",
    "Nokia N73": "Nokia_N73",
    "Motorola RAZR2": "Motorola_RAZR2",
    "iPod Touch": "IPod_Touch",
    "Game Boy": "Game_Boy",
  },
};

// ── Trailer URLs (verified official sources) ──────────────────────────

/** @type {Record<string, Record<string, string>>} */
const TRAILER_URLS = {
  film: {
    // Add verified official trailer URLs as found
  },
  game: {
    // Add verified official trailer URLs as found
  },
};

// ── Game screenshot overrides (when Wikimedia has no usable images) ───

/** @type {Record<string, Array<{ imageUrl: string, alt: string, sourceUrl: string, caption?: string }>>} */
const GAME_SCREENSHOT_OVERRIDES = {
  // Add per-game screenshot overrides as needed when Wikimedia comes up empty
};

// ── helpers ───────────────────────────────────────────────────────────

/**
 * Build the Wikipedia article title for a given kind + editorial label.
 * Falls back to replacing spaces with underscores if no override exists.
 */
function wikipediaTitleFor(kind, title) {
  const map = WIKI_TITLE_OVERRIDES[kind];
  if (map && map[title]) return map[title];
  return title.replace(/ /g, "_");
}

/** Encode a string into a filesystem-safe cache key (hex of SHA-like digest by simplicity). */
function cacheKey(kind, title) {
  const raw = `${kind}::${title}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) - h + raw.charCodeAt(i)) | 0;
  }
  return `m${Math.abs(h).toString(36)}`;
}

/**
 * Fetch a URL, caching the JSON response on disk.
 * Respects MWWM_REFRESH_SOURCES=1 to refetch.
 */
async function fetchCachedJson(url, cacheKeyStr, source) {
  const cacheFile = resolve(CACHE_DIR, `${cacheKeyStr}.json`);
  const refresh = process.env.MWWM_REFRESH_SOURCES === "1";

  if (!refresh) {
    try {
      const raw = await readFile(cacheFile, "utf8");
      return JSON.parse(raw);
    } catch {
      /* cache miss — fetch below */
    }
  }

  let json;
  let lastErr;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "MusicWalkWithMe/1.0 (https://github.com/back-in-my-days; artifact enrichment)" },
      });
      if (!res.ok) {
        if (res.status === 404) return null;
        if (res.status === 429) {
          lastErr = new Error(`HTTP 429 for ${url}`);
          const wait = Math.pow(2, attempt) * 1500;
          process.stderr.write(`MEDIA RATE-LIMITED ${source} retry in ${wait}ms\n`);
          await sleep(wait);
          continue;
        }
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      json = await res.json();
      break;
    } catch (err) {
      if (err.message && err.message.startsWith("HTTP 429")) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }

  if (!json) {
    if (refresh) {
      try {
        const raw = await readFile(cacheFile, "utf8");
        process.stderr.write(`MEDIA WARN ${source} using stale cache\n`);
        return JSON.parse(raw);
      } catch {
        /* no stale cache */
      }
    }
    throw lastErr || new Error(`Failed to fetch ${url}`);
  }

  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFile, JSON.stringify(json), "utf8");
  return json;
}

/**
 * Prefix protocol-relative Wikimedia URLs with https:.
 */
function absoluteWikimediaUrl(src) {
  if (!src) return "";
  if (src.startsWith("//")) return `https:${src}`;
  return src;
}

/**
 * Return the first sentence of `text`, trimmed to at most `max` chars
 * without splitting surrogate pairs. If no period, truncate at last space
 * before max and append ellipsis.
 */
function firstSentence(text, max = 170) {
  if (!text) return "";
  const dot = text.indexOf(".");
  if (dot !== -1 && dot < max) return text.slice(0, dot + 1);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > max * 0.6) return cut.slice(0, lastSpace) + "\u2026";
  return cut + "\u2026";
}

// ── Wikipedia API calls ───────────────────────────────────────────────

/**
 * Fetch the Wikipedia REST API summary for a kind + title.
 * Returns { thumbnail, originalimage, extract, pageUrl } or null.
 */
async function wikipediaSummary(kind, title) {
  const wikiTitle = wikipediaTitleFor(kind, title);
  const key = cacheKey(kind, title);
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`;
  const data = await fetchCachedJson(url, `summary-${key}`, `${kind}/${title}`);

  if (!data || data.type === "disambiguation") return null;

  return {
    thumbnail: data.thumbnail ? absoluteWikimediaUrl(data.thumbnail.source) : null,
    originalimage: data.originalimage ? absoluteWikimediaUrl(data.originalimage.source) : null,
    extract: data.extract || "",
    pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${wikiTitle}`,
  };
}

/**
 * Fetch the Wikipedia REST API media list for a kind + title.
 * Returns an array of { title, url, caption } image entries, or [].
 */
async function wikipediaMediaList(kind, title) {
  const wikiTitle = wikipediaTitleFor(kind, title);
  const key = cacheKey(kind, title);
  const url = `https://en.wikipedia.org/api/rest_v1/page/media-list/${wikiTitle}`;
  const data = await fetchCachedJson(url, `media-${key}`, `${kind}/${title}`);

  if (!data || !Array.isArray(data.items)) return [];

  const images = [];
  for (const item of data.items) {
    if (item.type !== "image") continue;
    // Prefer original, fall back to srcset
    let imgUrl = null;
    if (item.original?.source) {
      imgUrl = absoluteWikimediaUrl(item.original.source);
    } else if (item.srcset && item.srcset.length > 0) {
      // srcset entries are like "//upload.../file.jpg 1.5x"
      const best = item.srcset[item.srcset.length - 1].src;
      imgUrl = absoluteWikimediaUrl(best);
    }
    if (!imgUrl) continue;

    images.push({
      title: item.title || "",
      url: imgUrl,
      caption: item.caption?.text || "",
    });
  }
  return images;
}

// ── screenshot selection ──────────────────────────────────────────────

const SCREENSHOT_KEYWORDS = [
  "screenshot", "gameplay", "game", "player", "level",
  "battle", "racing", "match", "screen", "interface",
];

/**
 * Pick up to `limit` screenshot images from a media list, excluding
 * the cover image URL and preferring filename/caption hits.
 */
function screenshotImages(mediaList, coverUrl, sourceUrl, title, limit = 3) {
  // Normalize cover URL for comparison
  const coverBase = coverUrl ? coverUrl.split("/").pop()?.replace(/\.\w+$/, "") : null;

  const candidates = mediaList
    .filter((img) => {
      if (!img.url) return false;
      const imgBase = img.url.split("/").pop()?.replace(/\.\w+$/, "") || "";
      return imgBase !== coverBase;
    })
    .map((img) => {
      const text = `${img.title} ${img.caption}`.toLowerCase();
      let score = 0;
      for (const kw of SCREENSHOT_KEYWORDS) {
        if (text.includes(kw)) score += 1;
      }
      return { ...img, score };
    })
    .sort((a, b) => b.score - a.score);

  // If nothing scored, take un-scored images as fallback
  const scored = candidates.filter((c) => c.score > 0);
  const pool = scored.length > 0 ? scored : candidates;

  return pool.slice(0, limit).map((img) => ({
    imageUrl: img.url,
    alt: img.caption || `${title} screenshot`,
    sourceUrl,
    caption: img.caption || undefined,
  }));
}

// ── enrichment ────────────────────────────────────────────────────────

/**
 * Enrich a single film label → FilmArtifact.
 */
async function enrichFilm(title) {
  const summary = await wikipediaSummary(KIND_FILM, title);
  const pageUrl = summary?.pageUrl || `https://en.wikipedia.org/wiki/${wikipediaTitleFor(KIND_FILM, title)}`;
  await sleep(500);
  const posterUrl = summary?.thumbnail || summary?.originalimage || "";

  return {
    title,
    posterUrl,
    sourceUrl: pageUrl,
    trailerUrl: TRAILER_URLS.film?.[title] || undefined,
  };
}

/**
 * Enrich a single game label → GameArtifact.
 */
async function enrichGame(title) {
  const summary = await wikipediaSummary(KIND_GAME, title);
  const pageUrl = summary?.pageUrl || `https://en.wikipedia.org/wiki/${wikipediaTitleFor(KIND_GAME, title)}`;
  const coverUrl = summary?.thumbnail || summary?.originalimage || "";

  // Fetch media list for screenshots
  const mediaList = await wikipediaMediaList(KIND_GAME, title);

  let screenshots;
  if (GAME_SCREENSHOT_OVERRIDES[title]) {
    screenshots = GAME_SCREENSHOT_OVERRIDES[title];
  } else {
    screenshots = screenshotImages(mediaList, coverUrl, pageUrl, title, 3);
  }

  if (screenshots.length === 0) {
    process.stderr.write(`MEDIA WARN no screenshots for game ${title}\n`);
  }
  await sleep(500);

  return {
    title,
    coverUrl,
    sourceUrl: pageUrl,
    screenshots,
    trailerUrl: TRAILER_URLS.game?.[title] || undefined,
  };
}

/**
 * Enrich a single gadget label → GadgetArtifact.
 */
async function enrichGadget(title) {
  const summary = await wikipediaSummary(KIND_GADGET, title);
  const pageUrl = summary?.pageUrl || `https://en.wikipedia.org/wiki/${wikipediaTitleFor(KIND_GADGET, title)}`;
  let imageUrl = summary?.thumbnail || summary?.originalimage || "";

  // Fallback: use first image from media list when summary lacks a thumbnail
  if (!imageUrl) {
    const mediaList = await wikipediaMediaList(KIND_GADGET, title);
    const firstImg = mediaList.find((img) => img.url && !img.url.endsWith(".svg"));
    if (firstImg) imageUrl = firstImg.url;
  }
  const description = firstSentence(summary?.extract || "", 170);
  await sleep(500);

  return {
    title,
    imageUrl,
    sourceUrl: pageUrl,
    description,
  };
}

// ── public API ────────────────────────────────────────────────────────

/**
 * Enrich artifact label lists into the full rich EraArtifacts shape.
 *
 * @param {{ iso: string, year: number, artifacts: { films: string[], games: string[], gadgets: string[] } }} input
 * @returns {Promise<{ films: import("../src/types").FilmArtifact[], games: import("../src/types").GameArtifact[], gadgets: import("../src/types").GadgetArtifact[] }>}
 */
export async function enrichArtifacts({ iso, year, artifacts }) {
  const films = await mapLimit(artifacts.films, (t) => enrichFilm(t), 1);
  const games = await mapLimit(artifacts.games, (t) => enrichGame(t), 1);
  const gadgets = await mapLimit(artifacts.gadgets, (t) => enrichGadget(t), 1);

  return { films, games, gadgets };
}

/**
 * Validate enriched artifacts meet schema requirements.
 * Throws with descriptive prefix on any missing required field.
 *
 * @param {{ iso: string, year: number, artifacts: { films: any[], games: any[], gadgets: any[] } }} input
 */
export function validateEnrichedArtifacts({ iso, year, artifacts }) {
  for (const f of artifacts.films) {
    if (!f.posterUrl) {
      throw new Error(`ARTIFACT_MEDIA_MISSING_POSTER ${iso} ${year} ${f.title}`);
    }
  }
  for (const g of artifacts.games) {
    if (!g.coverUrl) {
      throw new Error(`ARTIFACT_MEDIA_MISSING_COVER ${iso} ${year} ${g.title}`);
    }
  }
  for (const d of artifacts.gadgets) {
    if (!d.imageUrl) {
      process.stderr.write(`MEDIA WARN no image for gadget ${iso} ${year} ${d.title}\n`);
    }
    if (!d.description) {
      throw new Error(`ARTIFACT_MEDIA_MISSING_GADGET_DESCRIPTION ${iso} ${year} ${d.title}`);
    }
  }
}
