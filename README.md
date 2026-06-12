# Back in My Days

Click a country, pick a year, and hear what teenagers were actually listening to.
Current coverage is **USA 1990-2007** and **Russia 2003-2007**: the landing is a
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

Audio and artwork are **not** stored in the repo and need no API key for default
generation. A weighted multi-source ranker pulls historical chart evidence per
country/year, then the top 20 candidates per configured year are resolved to iTunes
30 s previews + 600 px artwork at build time and written as **per-country shards**:

```bash
npm run data
```

- `scripts/capsule-config.mjs` — metadata-only per-country/year config (era label,
  color field, blurb). No hand-picked track lists.
- `scripts/rank.mjs` — deterministic weighted ranker: fetches multiple historical
  sources (Billboard, pop radio, alternative/modern-rock radio, TRL for USA;
  TopHit radio for Russia), scores
  tracks by source weights and cross-source agreement, and produces a ranked
  candidate queue.
- `scripts/hydrate.mjs` — consumes the ranked queue, resolves each candidate to
  an iTunes studio recording with a 30 s preview (skipping covers, karaoke,
  compilations, and soundtracks), enforces one hydrated lead artist per country/year playlist, and writes
  `public/data/<ISO>.json` (one file per country) plus a tiny
  `public/data/index.json` (`iso`, `countryName`, `years`, and one `heroTrack`
  so country-click can start sound immediately while the full shard loads).
- The app fetches `index.json` once for the map, then fetches a country's shard
  **only when you click it** (cached after). Full track data is not bundled into
  the JS, so it scales to many countries without bloating the initial load.

If a candidate cannot be matched to a previewable studio recording, the script
skips it and advances the queue. (iTunes rate-limits aggressive runs; the script
backs off and retries.)

## Inspecting source rankings

Inspect the ranked candidate queue for any country/year before hydration:

```bash
# USA 2005 top 40 with multi-source scores
npm run rank -- --dry-run USA 2005

# Same, with optional Last.fm recognition diagnostics (requires API key)
LASTFM_API_KEY=<key> npm run rank -- --dry-run USA 2005 --with-lastfm
```

### Source architecture

- **`COMMON_SOURCES.ranking`** — empty by default; add future all-country
  ranking sources here in one line.
- **`COMMON_SOURCES.enrichment`** — `lastfm-listener-enrichment`; applies to
  every country only during `--with-lastfm` dry runs (diagnostic only, never
  changes generated data).
- **`COUNTRY_SOURCE_SETS`** — readable per-country weighted source matrix in
  `scripts/source-registry.mjs`. USA (1990–2007) uses Billboard Year-End,
  Billboard number-ones, pop radio year-end, alternative/modern-rock radio year-end,
  TRL monthly Top Ten, and TRL number-one videos. Russia (2003–2007) uses TopHit
  annual radio charts.

The current USA default mix: Billboard Year-End Hot 100 (0.25–0.35),
pop radio year-end (0.20–0.25), alternative/modern-rock radio year-end (0.25),
TRL monthly Top Ten (0.20–0.25 from 1998), TRL number-one videos (0.05 from 1998),
and Billboard number-ones (0.05–0.15).

Russia's current mix: TopHit annual radio (0.75) and TopHit decade
release-year filter (0.25), covering 2003–2007.

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

1. Add or update the metadata in `scripts/capsule-config.mjs` (era label, color
   field, blurb, target track count).
2. Add a country source-set range to `scripts/source-registry.mjs` if the
   country needs its own weighted sources, or add new source adapters to
   `scripts/source-adapters.mjs` if the data source doesn't exist yet.
3. Run `npm run data` to regenerate the shards + index.
4. For a new country, add its alpha-3 → ISO-numeric id to `NUMERIC_BY_ISO` in
   `WorldMap.tsx`; the map lights it up automatically from the index and it gets
   the next soft "candy" color. Optionally set its landing year in
   `HERO_YEAR_BY_ISO` (`src/data/capsules.ts`).
