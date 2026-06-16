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
      1990: { era: "boombox / MTV pop-rap", field: "lime", blurb: "A boombox, a blank tape, and every cafeteria trying the Hammer dance.", artifacts: { films: ["Home Alone", "Pretty Woman", "Ghost", "Goodfellas"], games: ["Super Mario World", "The Secret of Monkey Island"], gadgets: ["Game Boy", "Sega Genesis", "Sony Walkman"] } },
      1991: { era: "grunge breaks / school dance", field: "blue", blurb: "The locker-door pivot: grunge on MTV, dance-pop at the gym, rap in the bus seats.", artifacts: { films: ["Terminator 2: Judgment Day", "The Silence of the Lambs", "Beauty and the Beast", "Point Break"], games: ["Sonic the Hedgehog", "Street Fighter II"], gadgets: ["SNES", "Sega CD", "Motorola MicroTAC"] } },
      1992: { era: "MTV alt / G-funk", field: "orange", blurb: "Grunge, G-funk, and big R&B choruses fighting for the same mixtape.", artifacts: { films: ["Aladdin", "Wayne's World", "Reservoir Dogs", "A League of Their Own"], games: ["Mortal Kombat", "Wolfenstein 3D", "Sonic the Hedgehog 2"], gadgets: ["Sega Genesis", "Super Nintendo", "Discman"] } },
      1993: { era: "CD-store mixtape", field: "pink", blurb: "Soundtrack singles, backpack rap, and alt-rock videos after school.", artifacts: { films: ["Jurassic Park", "The Nightmare Before Christmas", "Groundhog Day", "Dazed and Confused"], games: ["Doom", "Myst"], gadgets: ["Apple Newton", "Sega Saturn (JP)", "Motorola StarTAC"] } },
      1994: { era: "alt-rock takeover", field: "cyan", blurb: "Dookie, Weezer, Sabotage, and a little G-funk in the same backpack.", artifacts: { films: ["Pulp Fiction", "The Lion King", "Forrest Gump", "Clerks"], games: ["Super Metroid", "Donkey Kong Country", "Sonic & Knuckles"], gadgets: ["Sony PlayStation (JP)", "Sega Saturn (JP)", "Discman"] } },
      1995: { era: "mall radio / post-grunge", field: "lime", blurb: "Friends on TV, Jagged Little Pill in the car, and every chorus enormous.", artifacts: { films: ["Toy Story", "Clueless", "Friday", "Braveheart"], games: ["Chrono Trigger", "Command & Conquer"], gadgets: ["Sony PlayStation (US)", "Windows 95", "Palm Pilot"] } },
      1996: { era: "cafeteria MTV mix", field: "blue", blurb: "Alt one-hit staples, R&B radio, and the Macarena inescapably everywhere.", artifacts: { films: ["Scream", "Independence Day", "Space Jam", "Trainspotting"], games: ["Super Mario 64", "Tomb Raider", "Resident Evil"], gadgets: ["Nintendo 64", "Tamagotchi", "Palm Pilot"] } },
      1997: { era: "Spice / alt-radio", field: "orange", blurb: "Spice Girls, Hanson, alt-radio one-hit staples, and movie-single energy.", artifacts: { films: ["Titanic", "Men in Black", "Good Will Hunting", "Boogie Nights"], games: ["Final Fantasy VII", "GoldenEye 007", "Castlevania: Symphony of the Night"], gadgets: ["Nokia 6110 (Snake!)", "PS1", "AOL Instant Messenger"] } },
      1998: { era: "pre-TRL / graduation radio", field: "pink", blurb: "TRL was arriving, graduation songs were everywhere, and CDs lived in binders.", artifacts: { films: ["Saving Private Ryan", "The Big Lebowski", "Blade", "Rushmore"], games: ["The Legend of Zelda: Ocarina of Time", "Metal Gear Solid", "Half-Life"], gadgets: ["iMac G3", "Dreamcast (JP)", "Nokia 5110"] } },
      1999: { era: "peak TRL / Y2K hallway", field: "cyan", blurb: "Teen-pop saturation, nu-metal sneaking in, and Y2K hallway gossip.", artifacts: { films: ["The Matrix", "Fight Club", "American Pie", "10 Things I Hate About You"], games: ["Pokémon Red & Blue", "System Shock 2", "Age of Empires II"], gadgets: ["Napster", "Nokia 3210", "Sega Dreamcast (US)"] } },
      2000: { era: "TRL / mall-punk", field: "cyan", blurb: "TRL after school. Napster overnight. Burned CDs by morning.", artifacts: { films: ["Gladiator", "American Psycho", "Bring It On", "Almost Famous"], games: ["The Sims", "Diablo II", "Tony Hawk's Pro Skater 2"], gadgets: ["PlayStation 2", "Nokia 3310", "CD-RW drive"] } },
      2001: { era: "Napster / nu-metal", field: "blue", blurb: "AIM away messages, skate videos, and a folder called mp3s.", artifacts: { films: ["The Lord of the Rings: The Fellowship of the Ring", "Shrek", "Donnie Darko", "The Fast and the Furious"], games: ["Halo: Combat Evolved", "Grand Theft Auto III", "Super Smash Bros. Melee"], gadgets: ["iPod (1st gen)", "Xbox", "Game Boy Advance"] } },
      2002: { era: "skate-punk / pop radio", field: "orange", blurb: "The CD burner was hot and every chorus was huge.", artifacts: { films: ["Spider-Man", "The Lord of the Rings: The Two Towers", "8 Mile", "Bend It Like Beckham"], games: ["Grand Theft Auto: Vice City", "Metroid Prime", "Kingdom Hearts"], gadgets: ["iPod (touch wheel)", "Xbox Live", "Sidekick"] } },
      2003: { era: "TRL / emo starts", field: "pink", blurb: "Kazaa downloads, first eyeliner, and songs with massive bridges.", artifacts: { films: ["Pirates of the Caribbean", "Finding Nemo", "Kill Bill: Vol. 1", "School of Rock"], games: ["Call of Duty", "Star Wars: Knights of the Old Republic", "SSX 3"], gadgets: ["iPod (3rd gen)", "Nokia N-Gage", "Razer Diamondback"] } },
      2004: { era: "pop-punk / emo", field: "orange", blurb: "Freshman year. The CD binder was full.", artifacts: { films: ["Mean Girls", "Napoleon Dynamite", "Shaun of the Dead", "The Incredibles"], games: ["Grand Theft Auto: San Andreas", "World of Warcraft", "Halo 2"], gadgets: ["Nintendo DS", "Motorola RAZR V3", "iPod Mini"] } },
      2005: { era: "scene / pop-punk", field: "pink", blurb: "Homeroom, 2005. Your iPod was your whole personality.", artifacts: { films: ["Batman Begins", "Harry Potter and the Goblet of Fire", "Star Wars: Episode III", "The 40-Year-Old Virgin"], games: ["Resident Evil 4", "God of War", "Guitar Hero"], gadgets: ["iPod Video", "Xbox 360", "Motorola RAZR"] } },
      2006: { era: "emo / scene peak", field: "blue", blurb: "The year everyone discovered eyeliner and MySpace Top 8.", artifacts: { films: ["Borat", "The Devil Wears Prada", "Pan's Labyrinth", "Casino Royale"], games: ["The Elder Scrolls IV: Oblivion", "Gears of War", "Wii Sports"], gadgets: ["Nintendo Wii", "PS3", "iPod Nano 2G"] } },
      2007: { era: "scene / school-dance", field: "lime", blurb: "Senior year energy. The aux cord at every party.", artifacts: { films: ["Superbad", "Juno", "Knocked Up", "No Country for Old Men"], games: ["Halo 3", "BioShock", "Portal", "Call of Duty 4: Modern Warfare"], gadgets: ["iPhone", "iPod Touch", "Nintendo Wii"] } },
    },
  },
  {
    iso: "RUS",
    countryName: "Russia",
    heroYear: 2006,
    targetTracks: 20,
    years: {
      2003: { era: "Star Factory / early Zveri", field: "pink", blurb: "Early Zveri guitars, Star Factory hooks, and the first real ringtone era.", artifacts: { films: ["Kill Bill: Vol. 1", "Pirates of the Caribbean", "Terminator 3", "Брат 2"], games: ["Counter-Strike 1.6", "Warcraft III: The Frozen Throne"], gadgets: ["Nokia 3310", "Siemens C55", "Polyphonic ringtones"] } },
      2004: { era: "pop / pop-rock", field: "orange", blurb: "Чёрный бумер on every Nokia. The двор had a soundtrack.", artifacts: { films: ["Night Watch (Ночной дозор)", "Shrek 2", "The Day After Tomorrow", "Бумер"], games: ["Half-Life 2", "Grand Theft Auto: San Andreas"], gadgets: ["Motorola RAZR V3", "Nokia 6230", "IR port file swaps"] } },
      2005: { era: "pop-rock / dvor", field: "pink", blurb: "Районы, кварталы. A Walkman, a дача, and семки.", artifacts: { films: ["The 9th Company (9 рота)", "Star Wars: Episode III", "War of the Worlds", "Ночной базар"], games: ["World of Warcraft", "Need for Speed: Most Wanted"], gadgets: ["iPod Mini", "Sony Ericsson K750i", "ICQ"] } },
      2006: { era: "Eurovision pop", field: "blue", blurb: "Билан almost won Eurovision. You knew every word.", artifacts: { films: ["Day Watch (Дневной дозор)", "Pirates of the Caribbean: Dead Man's Chest", "The Devil Wears Prada", "Питер FM"], games: ["The Elder Scrolls IV: Oblivion", "Heroes of Might and Magic V"], gadgets: ["Motorola RAZR V3i", "Nokia N73", "VKontakte"] } },
      2007: { era: "glam pop / school disco", field: "lime", blurb: "Серебро, МакSим, and a Motorola RAZR.", artifacts: { films: ["The Irony of Fate 2 (Ирония судьбы 2)", "Transformers", "Spider-Man 3", "ЖARA"], games: ["Crysis", "Assassin's Creed", "Call of Duty 4: Modern Warfare"], gadgets: ["iPhone", "Motorola RAZR2", "Odnoklassniki"] } },
    },
  },
];
