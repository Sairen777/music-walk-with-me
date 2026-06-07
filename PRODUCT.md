# Product

## Register

brand

## Users
People roughly 25 to 40 who grew up online, now nostalgic for the music of their teenage years. They arrive curious and a little sentimental, usually on a whim ("what did I actually listen to back then?"), often sharing it with friends who went to school at the same time. Context is casual: a phone on the couch, a laptop tab between tasks. They are not researching charts; they want the feeling back.

## Product Purpose
Back in My Days lets you click a country and a year and immediately *hear and see* what teenagers there were actually listening to. The first release is a single, perfected loop for the United States, mid-2000s: click USA, land in the 2005 capsule, and a 30-second preview of the era's pop-punk / emo / scene anthems is already playing over a wall of album covers, framed in the web of the time.

Success is the gut-punch of recognition in under two seconds. If a visitor's first reaction is "oh my god, this song," the product worked. Charts-accuracy is explicitly *not* the goal; curated teenage memory is.

Audio and artwork are sourced free from the iTunes Search API and baked into static data at build time, so the experience loads instantly with no runtime API, no keys, and no licensing for 30-second previews.

## Brand Personality
Playful, unserious-on-purpose, warm, specific. The `.lol` domain is a promise: this is a toy, not a database. Voice is second-person and familiar ("Homeroom, 2005"), never the neutral third-person of a chart site. It should feel like a friend handing you their old iPod, not like analytics.

Three words: nostalgic, tactile, joyful.

## Anti-references
- **Chart dashboards / data tables.** Spotify Wrapped-style stat cards, ranked lists with chart positions, "data viz." The instant the music becomes a table, the feeling dies.
- **Clean modern SaaS.** Neutral grays, Inter, soft cards, generic dark mode. The opposite of the point.
- **Generic "retro."** Vague vaporwave gradients and palm trees. This is *specifically* 2004-2007 web and device design (iPod silhouette ads, MySpace, Web 2.0 glossy), not a mood board of "the past."
- **Cream / editorial-magazine restraint.** Warm-neutral paper backgrounds, display-serif-and-italic. Wrong register entirely.

## Design Principles
1. **Sound is the product.** The audio is the payload; everything visual exists to get a recognizable song into the visitor's ears within two seconds, on the very gesture that opened the capsule.
2. **Period-accurate, not retro-flavored.** Reproduce the actual interface language of the moment (the click-wheel iPod, the MySpace profile, Web 2.0 gloss), not a generic nostalgia aesthetic.
3. **Recognition over information.** Album covers and the opening riff trigger memory faster than any text. Lead with art and audio; relegate metadata.
4. **One loop, perfected.** Ship a single era end-to-end at studio quality before widening to more years and countries. Depth beats breadth.
5. **A toy, addressed to you.** Second-person, warm, a little silly. Every label should sound like a friend, never like a chart.

## Accessibility & Inclusion
Target WCAG 2.1 AA. The skeuomorphic, period-accurate look must not cost usability: real semantics (landmarks, headings, button/link roles, accessible names), full keyboard operation of the map, year selector, and player, and visible focus styling that fits the skin. Audio never autoplays without the user's initiating gesture (clicking a country counts) and is always pausable. Every animation, including the capsule "boot-up," has a `prefers-reduced-motion` crossfade/instant alternative. Color contrast is verified against the neon fields; text on vivid backgrounds uses black or white at AA, never mid-gray.
