/**
 * Per-country/year metadata config for the automated capsule ranker.
 * This replaces the hand-authored seed.mjs track arrays.
 *
 * @typedef {{ era: string, field: "pink"|"lime"|"cyan"|"orange"|"blue", blurb: string }} YearMeta
 * @typedef {{ iso: string, countryName: string, heroYear: number, targetTracks: number, years: Record<number, YearMeta> }} CapsuleConfig
 */
export const capsuleConfig = [
  {
    iso: "USA",
    countryName: "USA",
    heroYear: 2005,
    targetTracks: 20,
    years: {
      1990: { era: "boombox / MTV pop-rap", field: "lime", blurb: "A boombox, a blank tape, and every cafeteria trying the Hammer dance." },
      1991: { era: "grunge breaks / school dance", field: "blue", blurb: "The locker-door pivot: grunge on MTV, dance-pop at the gym, rap in the bus seats." },
      1992: { era: "MTV alt / G-funk", field: "orange", blurb: "Grunge, G-funk, and big R&B choruses fighting for the same mixtape." },
      1993: { era: "CD-store mixtape", field: "pink", blurb: "Soundtrack singles, backpack rap, and alt-rock videos after school." },
      1994: { era: "alt-rock takeover", field: "cyan", blurb: "Dookie, Weezer, Sabotage, and a little G-funk in the same backpack." },
      1995: { era: "mall radio / post-grunge", field: "lime", blurb: "Friends on TV, Jagged Little Pill in the car, and every chorus enormous." },
      1996: { era: "cafeteria MTV mix", field: "blue", blurb: "Alt one-hit staples, R&B radio, and the Macarena inescapably everywhere." },
      1997: { era: "Spice / alt-radio", field: "orange", blurb: "Spice Girls, Hanson, alt-radio one-hit staples, and movie-single energy." },
      1998: { era: "pre-TRL / graduation radio", field: "pink", blurb: "TRL was arriving, graduation songs were everywhere, and CDs lived in binders." },
      1999: { era: "peak TRL / Y2K hallway", field: "cyan", blurb: "Teen-pop saturation, nu-metal sneaking in, and Y2K hallway gossip." },
      2000: { era: "TRL / mall-punk", field: "cyan", blurb: "TRL after school. Napster overnight. Burned CDs by morning." },
      2001: { era: "Napster / nu-metal", field: "blue", blurb: "AIM away messages, skate videos, and a folder called mp3s." },
      2002: { era: "skate-punk / pop radio", field: "orange", blurb: "The CD burner was hot and every chorus was huge." },
      2003: { era: "TRL / emo starts", field: "pink", blurb: "Kazaa downloads, first eyeliner, and songs with massive bridges." },
      2004: { era: "pop-punk / emo", field: "orange", blurb: "Freshman year. The CD binder was full." },
      2005: { era: "scene / pop-punk", field: "pink", blurb: "Homeroom, 2005. Your iPod was your whole personality." },
      2006: { era: "emo / scene peak", field: "blue", blurb: "The year everyone discovered eyeliner and MySpace Top 8." },
      2007: { era: "scene / school-dance", field: "lime", blurb: "Senior year energy. The aux cord at every party." },
    },
  },
  {
    iso: "RUS",
    countryName: "Russia",
    heroYear: 2006,
    targetTracks: 20,
    years: {
      2003: { era: "Star Factory / early Zveri", field: "pink", blurb: "Early Zveri guitars, Star Factory hooks, and the first real ringtone era." },
      2004: { era: "pop / pop-rock", field: "orange", blurb: "Чёрный бумер on every Nokia. The двор had a soundtrack." },
      2005: { era: "pop-rock / dvor", field: "pink", blurb: "Районы, кварталы. A Walkman, a дача, and семки." },
      2006: { era: "Eurovision pop", field: "blue", blurb: "Билан almost won Eurovision. You knew every word." },
      2007: { era: "glam pop / school disco", field: "lime", blurb: "Серебро, МакSим, and a Motorola RAZR." },
    },
  },
];
