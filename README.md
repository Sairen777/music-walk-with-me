# Back in My Days

Click a country, pick a year, and hear what teenagers were actually listening to.
The first release is one perfected loop: **USA, 2004-2007**. Click the USA, land in
the 2005 capsule, and a 30-second preview of the era's pop-punk / emo / scene
anthems is already playing over a wall of album covers, framed in the web of the
time (a click-wheel iPod, a Web 2.0 profile, the iPod-ad color field).

It is a toy, on purpose. The goal is the gut-punch of recognition, not chart
accuracy. See `PRODUCT.md` and `DESIGN.md` for the full intent and visual system.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
```

## The music data

Audio and artwork are **not** stored in the repo and need no API key. A curated
editorial seed (the "what teens actually blasted" layer) is resolved to real
iTunes 30-second previews + 600px artwork at build time:

```bash
node scripts/hydrate.mjs
```

- `scripts/seed.mjs` — hand-authored `{ country, year, era, tracks[] }`. Edit this
  to change what plays.
- `scripts/hydrate.mjs` — queries the public iTunes Search API per track, keeps the
  original studio release (skips covers, karaoke, comps, soundtracks), and writes
  `src/data/capsules.json`.
- The app imports that static JSON, so it loads instantly with no runtime API,
  no CORS, and no rate limits.

If a track can't be matched to a previewable studio recording, the script prints a
`MISS` and leaves it out; fix or substitute it in `seed.mjs` and rerun.

## How it's built

- **Vite + React + TypeScript**, no UI framework; the period skin is hand-written CSS.
- `src/components/WorldMap.tsx` — `d3-geo` + `world-atlas` topojson; the USA is the
  lit, clickable hero, every other country dimmed.
- `src/components/IpodPlayer.tsx` — the click-wheel iPod (the aesthetic centerpiece).
- `src/components/AlbumWall.tsx` — the grid of real covers; tap one to play.
- `src/components/YearDial.tsx` — the year selector (a keyboard-operable radiogroup).
- `src/audio/player.tsx` — a single `HTMLAudioElement` behind a context, with a
  queue and full transport. Playback starts on the click that opens a capsule, so
  the browser permits audio.

## Adding a year or country

1. Add an `EraSeed` entry to `scripts/seed.mjs` (give it a `field` color and `blurb`).
2. Run `node scripts/hydrate.mjs`.
3. For a new country, add its alpha-3 → ISO-numeric id to `NUMERIC_BY_ISO` in
   `WorldMap.tsx` so the map can light it up.
