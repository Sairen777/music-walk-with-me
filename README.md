# Back in My Days

Click a country, pick a year, and hear what teenagers were actually listening to.
Current coverage is **USA 1990-2007** and **Russia 2000-2007**: the landing is a
calm, bubbly world map; click a country and you drop into a period capsule where a
30-second preview is already playing over a wall of real album covers, framed in the
web of the time (a click-wheel iPod, a Web 2.0 profile).

It is a toy, on purpose. The goal is the gut-punch of recognition, not chart
accuracy. See `PRODUCT.md` and `DESIGN.md` for the full intent and visual system.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

## The music data

Audio and artwork are **not** stored in the repo and need no API key. A curated
editorial seed (the "what teens actually blasted" layer) is resolved to real iTunes
30-second previews + 600px artwork at build time and written as **per-country shards**:

```bash
node scripts/hydrate.mjs
```

- `scripts/seed.mjs` — hand-authored `{ iso, countryName, year, era, field, blurb, tracks[] }`.
  Edit this to change what plays. Cyrillic titles work (the matcher transliterates).
- `scripts/hydrate.mjs` — queries the public iTunes Search API per track, keeps the
  original studio release (skips covers, karaoke, comps, soundtracks), and writes
  `public/data/<ISO>.json` (one file per country) plus a tiny `public/data/index.json`
  (`iso`, `countryName`, `years`, and one `heroTrack` so country-click can start sound
  immediately while the full shard loads).
- The app fetches `index.json` once for the map, then fetches a country's shard **only
  when you click it** (cached after). Full track data is not bundled into the JS, so it
  scales to many countries without bloating the initial load. If one country ever gets
  huge, split its shard by decade the same way.

If a track can't be matched to a previewable studio recording, the script prints a
`MISS` and leaves it out; fix or substitute it in `seed.mjs` and rerun. (iTunes rate-
limits aggressive runs; the script backs off and retries.)

The USA catalog now reaches **1990**. For pre-iTunes years, the seed list is curated
from chart/radio/MTV/local-memory signals, then still hydrated through iTunes where
Apple has retroactive catalog previews and artwork.

## How it's built

- **Vite + React + TypeScript**, no UI framework; the period skin is hand-written CSS.
- `src/data/capsules.ts` — async, cached loaders (`loadIndex`, `loadCountry`).
- `src/components/WorldMap.tsx` — `d3-geo` + `world-atlas` topojson; every country with a
  shard lights up as a clickable, candy-colored target on the calm landing.
- `src/components/CapsuleScene.tsx` — fetches the clicked country's shard, shows a loading
  state, then the iPod + album wall; the year dial switches years from the cached shard.
- `src/components/IpodPlayer.tsx` — the click-wheel iPod (the aesthetic centerpiece).
- `src/audio/player.tsx` — a single `HTMLAudioElement` behind a context, with a queue and
  full transport. Because tracks load async, the country click "unlocks" the element (a
  silent blip inside the gesture) so the preview still autoplays once it arrives.

## Adding a year or country

1. Add an `EraSeed` entry (or a new track) to `scripts/seed.mjs`.
2. Run `node scripts/hydrate.mjs` to regenerate the shards + index.
3. For a new country, add its alpha-3 -> ISO-numeric id to `NUMERIC_BY_ISO` in
   `WorldMap.tsx`; the map lights it up automatically from the index and it gets the
   next soft "candy" color. Optionally set its landing year in `HERO_YEAR_BY_ISO`
   (`src/data/capsules.ts`).
