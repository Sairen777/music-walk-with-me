# Design

Visual system for **Back in My Days** (backinmydays.lol). Period-accurate web nostalgia, mid-2000s United States. Two art-directed worlds, one per moment of the loop.

## Theme

A toy that reproduces the interface language of 1990-2007. Not "retro" mood, but the literal devices and sites of each era. The experience moves through two visual worlds:

1. **The Landing (USA yearbook picker).** Dark glossy year-card grid. Year cards reuse the era's capsule skin colors, with overlapping album-cover stacks. This is the menu.
2. **The Capsule (MySpace / Web 2.0 world).** Opens when you pick a year. A period content surface: light panels, glossy aqua headers, beveled buttons, Tahoma/Verdana, the cluttered-charming profile frame. Holds the device player + souvenir panel + album-cover wall. Capsule skins are year-specific.

Art direction differs between the two worlds on purpose (brand register permits per-section worlds); voice and warmth stay constant.


## Color

Strategy: **Dark glossy** for the Landing, **Full palette** for the Capsule. OKLCH throughout.

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

- **Landing:** dark glossy full-viewport with centered year-card grid. Cards use period skin variables, stagger-in on load. This is the menu; one dominant idea per fold, deliberate and poster-like.
- **Capsule:** a two-column period layout at >= 900px (skinned device player left/sticky, album wall right), collapsing to a single stack on mobile. The desktop player column uses `minmax(280px, 380px)` to accommodate wider controller, desktop, phone, and remote player silhouettes. Album wall is a responsive grid `repeat(auto-fill, minmax(132px, 1fr))` of cover tiles, never identical cards with icon+title chrome; the cover *is* the tile.
- Fluid spacing via `clamp()`; tight groupings inside panels, generous separation between worlds.
- Border radius stays period-correct: iPod corners ~`18-22px` (device), panels/buttons `4-8px` (Web 2.0 was barely rounded). No 32px+ card rounding.

## Components

- **YearLanding** — the USA-only yearbook picker. Responsive grid of year-card buttons (1990-2007), each showing the year number, skin label, overlapping track cover stack, era tag, blurb, and track/artifact counts. Includes an AIM-style away-message Easter egg and a mini player strip.
- **CapsuleScene** — the period capsule view. Receives pre-loaded USA capsules as props; the glossy header bar shows "USA Yearbook" and the current year, with the YearDial for switching years inside the loaded data. Contains the DevicePlayer, YearSouvenirPanel, AlbumWall, and ArtifactsPanel.
- **YearSouvenirPanel** — a nostalgia-note panel listing the first track, device skin label, and first film/game/gadget from the capsule's artifact data.
- **NostalgiaStickers** — Easter-egg sticker overlay (BRB, AIM, TRL, Top 8, burned CD, Kazaa?) activated via the Konami code. Fixed-position, non-interactive, with floating animation.
- **DevicePlayer** — one audio/control implementation that CSS skins per year via `data-device` and `data-layout` attributes. Renders the now-playing screen (cover thumb, track, artist, scrubber, timecodes), real transport (play/pause, next/prev, seek), and a control area whose silhouette changes per layout (touchwheel, cassette, controller, desktop, disc, handheld, phone, remote, glass-phone, winamp).
- **YearDial** — skeuomorphic selector for the available years in a capsule. Reads as a physical click-wheel/tuner.
- **AlbumWall** — grid of real album covers (iTunes artwork, upscaled 600px). Hover = lift + title; click = play that track + set queue. Currently-playing tile marked with an equalizer bob.
- **ArtifactsPanel** — pop-culture shelf showing films, games, and gadgets from the capsule's artifact data, with staggered card layouts and trailer links.

## Motion

Materials: transform, opacity, clip-path (capsule boot wipe), filter/blur (field bloom), box-shadow (gloss). No layout-property animation.

- **Year-card hover/select:** card lifts with shadow and accent border; selecting opens the capsule.
- **Landing card stagger:** cards animate in with staggered delays on load. Konami sticker layer floats gently.
- **Click wheel:** tactile press feedback; scrubber + equalizer animate with playback.
- **Reduced motion:** all of the above degrade to instant/crossfade via `prefers-reduced-motion: reduce`. Content is visible by default; reveals only enhance.

## Audio / Data

- Curated seed: `{ country, year, era, tracks: [{ artist, title }] }` (the editorial "what teens blasted" layer).
- Build-time hydration script queries iTunes Search API per track, writing `previewUrl` + `artworkUrl` (600px) into static `tracks.json`. No runtime API, no keys, no CORS.
- Playback: single `HTMLAudioElement`, autoplay permitted on the year-click gesture, always pausable, queue advances through the wall.
