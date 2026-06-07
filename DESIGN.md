# Design

Visual system for **Back in My Days** (backinmydays.lol). Period-accurate web nostalgia, mid-2000s United States. Two art-directed worlds, one per moment of the loop.

## Theme

A toy that reproduces the interface language of 2004-2007. Not "retro" mood, but the literal devices and sites of the era. The experience moves through two visual worlds:

1. **The Shell (iPod-ad world).** The landing + world map. Drenched in a single vivid iPod-silhouette-ad color field, black "ink", white device + earbud-cable motifs. Clean Helvetica. This is the poster.
2. **The Capsule (MySpace / Web 2.0 world).** Opens when you pick a country + year. A period content surface: light panels, glossy aqua headers, beveled buttons, Tahoma/Verdana, the cluttered-charming profile frame. Holds the iPod player + album-cover wall.

Art direction differs between the two worlds on purpose (brand register permits per-section worlds); voice and warmth stay constant.

Default theme is **light** (the era's web and the iPod UI were overwhelmingly light/white); the Shell's vivid field provides the drama, not a dark mode.

## Color

Strategy: **Drenched** for the Shell, **Full palette** for the Capsule. OKLCH throughout.

### Era color fields (iPod-ad chroma)
Each era owns one saturated field. 2005 = hot pink. Others reserved for future years; the active field is exposed as `--field`.

| Token | OKLCH | Use |
| --- | --- | --- |
| `--field-pink` | `oklch(0.66 0.24 358)` | **2005 signature field** |
| `--field-lime` | `oklch(0.86 0.21 132)` | reserved |
| `--field-cyan` | `oklch(0.80 0.13 220)` | reserved |
| `--field-orange` | `oklch(0.72 0.20 48)` | reserved |
| `--field-blue` | `oklch(0.60 0.18 256)` | reserved |

### Core
| Token | OKLCH | Use |
| --- | --- | --- |
| `--ink` | `oklch(0.17 0.02 280)` | near-black silhouette ink, body text on light |
| `--paper` | `oklch(1 0 0)` | pure white (iPod body, earbuds, panels) |
| `--ink-on-field` | `oklch(0.15 0.02 350)` | text on the pink field (AA: ~9:1) |
| `--cable` | `oklch(1 0 0)` | white earbud-cable + iPod accents |

### Capsule (MySpace / Web 2.0)
| Token | OKLCH | Use |
| --- | --- | --- |
| `--ms-bg` | `oklch(0.90 0.005 250)` | profile gray backdrop |
| `--ms-panel` | `oklch(0.985 0 0)` | white content panels |
| `--ms-line` | `oklch(0.78 0.01 250)` | 1px panel borders |
| `--ms-blue` | `oklch(0.50 0.12 245)` | glossy header blue |
| `--ms-blue-lite`| `oklch(0.70 0.11 240)` | gloss highlight stop |
| `--ms-text` | `oklch(0.25 0.02 260)` | capsule body text (AA on white + gray) |
| `--ms-link` | `oklch(0.45 0.15 250)` | classic web link blue |

Contrast: body text uses `--ink` / `--ms-text` (>= 7:1). Text on `--field-pink` is black `--ink-on-field` or white per local need, verified >= 4.5:1. No mid-gray body text anywhere.

## Typography

Period-authentic system stacks. No modern web-font reflexes; the era *was* system fonts. Three roles, all grotesque/system, distinguished by stack + treatment, not by importing competing display faces.

- **Display / iPod UI** `--font-ipod`: `"Helvetica Neue", Helvetica, Arial, sans-serif`. The iPod-ad and device voice. Tight, bold, high-contrast. Brand wordmark rendered here with a Web 2.0 glossy treatment.
- **Capsule UI** `--font-ms`: `Tahoma, Verdana, Geneva, "DejaVu Sans", sans-serif`. The literal MySpace stack.
- **Mono / timecodes** `--font-mono`: `"Courier New", ui-monospace, monospace`. Player timecodes, tiny period detail only. Never body.

Scale: fluid `clamp()`, ratio >= 1.25. Wordmark ceiling clamp max <= 6rem. Display letter-spacing floor `-0.04em` (wordmark uses ~`-0.02em`). `text-wrap: balance` on headings.

## Layout

- **Shell:** single full-viewport field. The world map sits center/lower, the wordmark upper. One dominant idea per fold; deliberate, poster-like.
- **Capsule:** a two-column period layout at >= 900px (iPod player left/sticky, album wall right), collapsing to a single stack on mobile. Album wall is a responsive grid `repeat(auto-fill, minmax(132px, 1fr))` of cover tiles, never identical cards with icon+title chrome; the cover *is* the tile.
- Fluid spacing via `clamp()`; tight groupings inside panels, generous separation between worlds.
- Border radius stays period-correct: iPod corners ~`18-22px` (device), panels/buttons `4-8px` (Web 2.0 was barely rounded). No 32px+ card rounding.

## Components

- **WorldMap** — `d3-geo` rendered SVG. USA is the lit, clickable, hoverable hero (white silhouette on the field, the iPod-ad inversion); every other country is dimmed and tagged "more soon". Keyboard-focusable.
- **YearDial** — skeuomorphic selector for the available years (2004-2007), default 2005. Reads as a physical click-wheel/tuner, drives `--field` + the capsule contents.
- **IpodPlayer** — click-wheel iPod (white, color-screen era). Now-playing screen (cover thumb, track, artist, scrubber, timecodes), real transport (play/pause, next/prev, seek), wheel as a real control. The aesthetic centerpiece.
- **AlbumWall** — grid of real album covers (iTunes artwork, upscaled 600px). Hover = lift + title; click = play that track + set queue. Currently-playing tile marked with an equalizer bob.
- **CapsuleFrame** — the MySpace/Web 2.0 chrome (glossy header bar with "Homeroom, 2005", panels) that houses player + wall, with the boot-up reveal.

## Motion

Materials: transform, opacity, clip-path (capsule boot wipe), filter/blur (field bloom), box-shadow (gloss). No layout-property animation.

- **Capsule boot:** an iPod-style power-on — quick screen-wipe + contents staggering in (album wall tiles cascade). Ease-out-expo, ~320-520ms.
- **Map hover/select:** USA lifts/brightens; selecting zooms-punches into the capsule.
- **Click wheel:** tactile press feedback; scrubber + equalizer animate with playback.
- **Reduced motion:** all of the above degrade to instant/crossfade via `prefers-reduced-motion: reduce`. Content is visible by default; reveals only enhance.

## Audio / Data

- Curated seed: `{ country, year, era, tracks: [{ artist, title }] }` (the editorial "what teens blasted" layer).
- Build-time hydration script queries iTunes Search API per track, writing `previewUrl` + `artworkUrl` (600px) into static `tracks.json`. No runtime API, no keys, no CORS.
- Playback: single `HTMLAudioElement`, autoplay permitted on the country-click gesture, always pausable, queue advances through the wall.
