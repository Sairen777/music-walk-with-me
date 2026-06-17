export type InternetArtifactKind = "meme" | "flash" | "site" | "viral-video" | "place";

export interface YearInternetArtifact {
  title: string;
  kind: InternetArtifactKind;
  yearStarted: number;
  description: string;
  sourceUrl: string;
  sourceLabel?: string;
  youtubeId?: string;
}

const INTERNET_BY_YEAR: Record<number, readonly YearInternetArtifact[]> = {
  1996: [
    {
      title: "Dancing Baby",
      kind: "meme",
      yearStarted: 1996,
      description: "The looping 3D baby that escaped email chains into prime-time TV.",
      sourceUrl: "https://knowyourmeme.com/memes/dancing-baby",
      sourceLabel: "Know Your Meme",
    },
    {
      title: "Space Jam official site",
      kind: "site",
      yearStarted: 1996,
      description: "A frozen-in-amber movie promo site: star fields, tiny buttons, maximum Web 1.0.",
      sourceUrl: "https://www.spacejam.com/1996/",
      sourceLabel: "spacejam.com",
    },
  ],
  1997: [
    {
      title: "Bert is Evil",
      kind: "meme",
      yearStarted: 1997,
      description: "Photoshop conspiracy-board energy before image macros had a name.",
      sourceUrl: "https://knowyourmeme.com/memes/bert-is-evil",
      sourceLabel: "Know Your Meme",
    },
  ],
  1998: [
    {
      title: "Hampster Dance",
      kind: "meme",
      yearStarted: 1998,
      description: "Four looping hamsters, one squeaky hook, and a million forwarded links.",
      sourceUrl: "https://knowyourmeme.com/memes/hampster-dance",
      sourceLabel: "Know Your Meme",
    },
  ],
  1999: [
    {
      title: "Mahir: I Kiss You!",
      kind: "meme",
      yearStarted: 1999,
      description: "Personal-homepage weirdness turns into a global pre-social viral celebrity.",
      sourceUrl: "https://en.wikipedia.org/wiki/Mahir_%C3%87a%C4%9Fr%C4%B1",
      sourceLabel: "Wikipedia",
    },
    {
      title: "Blogger launches",
      kind: "site",
      yearStarted: 1999,
      description: "Before feeds and socials, everybody wanted a blogspot-style diary.",
      sourceUrl: "https://en.wikipedia.org/wiki/Blogger_(service)",
      sourceLabel: "Wikipedia",
    },
  ],
  2000: [
    {
      title: "All Your Base",
      kind: "flash",
      yearStarted: 2000,
      description: "Bad translation, techno loop, and the first big remix-caption pile-on.",
      sourceUrl: "https://knowyourmeme.com/memes/all-your-base-are-belong-to-us",
      sourceLabel: "Know Your Meme",
    },
    {
      title: "Homestar Runner",
      kind: "site",
      yearStarted: 2000,
      description: "A Flash cartoon island that made the web feel handcrafted and extremely quotable.",
      sourceUrl: "https://www.homestarrunner.com/",
      sourceLabel: "homestarrunner.com",
    },
  ],
  2001: [
    {
      title: "Strong Bad Email",
      kind: "flash",
      yearStarted: 2001,
      description: "Checking an email became a weekly cartoon ritual.",
      sourceUrl: "https://en.wikipedia.org/wiki/Strong_Bad_Email",
      sourceLabel: "Wikipedia",
    },
    {
      title: "YTMND",
      kind: "site",
      yearStarted: 2001,
      description: "Looped GIF, huge caption, tiny sound clip: the entire joke in one page.",
      sourceUrl: "https://en.wikipedia.org/wiki/YTMND",
      sourceLabel: "Wikipedia",
    },
  ],
  2002: [
    {
      title: "Peanut Butter Jelly Time",
      kind: "flash",
      yearStarted: 2002,
      description: "The banana suit entered school-computer-lab history.",
      sourceUrl: "https://knowyourmeme.com/memes/peanut-butter-jelly-time",
      sourceLabel: "Know Your Meme",
    },
  ],
  2003: [
    {
      title: "Star Wars Kid",
      kind: "viral-video",
      yearStarted: 2003,
      description: "A camcorder clip became an early warning label for internet virality.",
      sourceUrl: "https://knowyourmeme.com/memes/star-wars-kid",
      sourceLabel: "Know Your Meme",
    },
    {
      title: "Badger Badger Badger",
      kind: "flash",
      yearStarted: 2003,
      description: "Badgers, mushrooms, snake: a perfect Flash loop with no off switch.",
      sourceUrl: "https://www.weebls-stuff.com/toons/badgers/",
      sourceLabel: "Weebl's Stuff",
    },
  ],
  2004: [
    {
      title: "Numa Numa",
      kind: "viral-video",
      yearStarted: 2004,
      description: "Webcam lip-sync joy before every laptop had a camera.",
      sourceUrl: "https://knowyourmeme.com/memes/numa-numa",
      sourceLabel: "Know Your Meme",
    },
    {
      title: "JibJab: This Land",
      kind: "flash",
      yearStarted: 2004,
      description: "Election-year Flash satire got emailed like a chain letter with production values.",
      sourceUrl: "https://en.wikipedia.org/wiki/JibJab",
      sourceLabel: "Wikipedia",
    },
  ],
  2005: [
    {
      title: "Me at the zoo",
      kind: "viral-video",
      yearStarted: 2005,
      description: "The first YouTube upload: short, awkward, and accidentally historic.",
      sourceUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      sourceLabel: "YouTube",
      youtubeId: "jNQXAC9IVRw",
    },
    {
      title: "Lazy Sunday",
      kind: "viral-video",
      yearStarted: 2005,
      description: "An SNL sketch that helped prove YouTube could move culture overnight.",
      sourceUrl: "https://en.wikipedia.org/wiki/Lazy_Sunday_(The_Lonely_Island_song)",
      sourceLabel: "Wikipedia",
    },
    {
      title: "Leeroy Jenkins",
      kind: "viral-video",
      yearStarted: 2005,
      description: "A doomed World of Warcraft pull becomes every group-project battle cry.",
      sourceUrl: "https://en.wikipedia.org/wiki/Leeroy_Jenkins",
      sourceLabel: "Wikipedia",
    },
  ],
  2006: [
    {
      title: "Evolution of Dance",
      kind: "viral-video",
      yearStarted: 2006,
      description: "One guy, six minutes, and the early YouTube monoculture fully online.",
      sourceUrl: "https://www.youtube.com/watch?v=dMH0bHeiRNg",
      sourceLabel: "YouTube",
      youtubeId: "dMH0bHeiRNg",
    },
    {
      title: "Shoes",
      kind: "viral-video",
      yearStarted: 2006,
      description: "Kelly wanted shoes; every AIM away message got the quote.",
      sourceUrl: "https://www.youtube.com/watch?v=3HjIljJd-o0",
      sourceLabel: "YouTube",
      youtubeId: "3HjIljJd-o0",
    },
    {
      title: "Ask a Ninja",
      kind: "site",
      yearStarted: 2006,
      description: "A web series before web series had a shared template.",
      sourceUrl: "https://en.wikipedia.org/wiki/Ask_a_Ninja",
      sourceLabel: "Wikipedia",
    },
  ],
  2007: [
    {
      title: "Chocolate Rain",
      kind: "viral-video",
      yearStarted: 2007,
      description: "Tay Zonday moved away from the mic to breathe and became YouTube canon.",
      sourceUrl: "https://www.youtube.com/watch?v=EwTZ2xpQwpA",
      sourceLabel: "YouTube",
      youtubeId: "EwTZ2xpQwpA",
    },
    {
      title: "Leave Britney Alone",
      kind: "viral-video",
      yearStarted: 2007,
      description: "A webcam plea became a quote, a punchline, and then a time capsule.",
      sourceUrl: "https://knowyourmeme.com/memes/leave-britney-alone",
      sourceLabel: "Know Your Meme",
    },
    {
      title: "Rickrolling",
      kind: "meme",
      yearStarted: 2007,
      description: "The bait-and-switch link that made every URL suspicious.",
      sourceUrl: "https://en.wikipedia.org/wiki/Rickrolling",
      sourceLabel: "Wikipedia",
    },
    {
      title: "I Can Has Cheezburger?",
      kind: "site",
      yearStarted: 2007,
      description: "Lolcats escaped forums and became a front-page internet dialect.",
      sourceUrl: "https://en.wikipedia.org/wiki/I_Can_Has_Cheezburger%3F",
      sourceLabel: "Wikipedia",
    },
  ],
};

export function internetForYear(year: number): readonly YearInternetArtifact[] {
  return INTERNET_BY_YEAR[year] ?? [];
}

export function youtubeThumbnail(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}
