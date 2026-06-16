export type DeviceLayout =
  | "cassette"
  | "controller"
  | "desktop"
  | "disc"
  | "glass-phone"
  | "handheld"
  | "phone"
  | "remote"
  | "touchwheel"
  | "winamp";

export interface YearSkin {
  year: number;
  id: string;
  pageLabel: string;
  device: string;
  deviceLabel: string;
  layout: DeviceLayout;
}

export const YEAR_SKINS: Record<number, YearSkin> = {
  1990: {
    year: 1990,
    id: "y1990-walkman",
    pageLabel: "MTV cassette wall",
    device: "walkman",
    deviceLabel: "Walkman cassette",
    layout: "cassette",
  },
  1991: {
    year: 1991,
    id: "y1991-snes",
    pageLabel: "16-bit bedroom",
    device: "snes-pad",
    deviceLabel: "SNES controller",
    layout: "controller",
  },
  1992: {
    year: 1992,
    id: "y1992-discman-arcade",
    pageLabel: "Discman arcade",
    device: "discman",
    deviceLabel: "Discman CD player",
    layout: "disc",
  },
  1993: {
    year: 1993,
    id: "y1993-newton",
    pageLabel: "Newton notepad",
    device: "newton",
    deviceLabel: "Apple Newton",
    layout: "handheld",
  },
  1994: {
    year: 1994,
    id: "y1994-playstation",
    pageLabel: "gray console CD case",
    device: "playstation",
    deviceLabel: "PlayStation console",
    layout: "controller",
  },
  1995: {
    year: 1995,
    id: "y1995-win95",
    pageLabel: "Windows 95 desktop",
    device: "win95-player",
    deviceLabel: "Windows 95 Media Player",
    layout: "desktop",
  },
  1996: {
    year: 1996,
    id: "y1996-n64",
    pageLabel: "rental-store console",
    device: "n64-pad",
    deviceLabel: "Nintendo 64 controller",
    layout: "controller",
  },
  1997: {
    year: 1997,
    id: "y1997-nokia6110",
    pageLabel: "Snake phone",
    device: "nokia6110",
    deviceLabel: "Nokia 6110",
    layout: "phone",
  },
  1998: {
    year: 1998,
    id: "y1998-imac-g3",
    pageLabel: "Bondi translucent iMac",
    device: "imac-g3",
    deviceLabel: "iMac G3",
    layout: "desktop",
  },
  1999: {
    year: 1999,
    id: "y1999-winamp",
    pageLabel: "Winamp Y2K desktop",
    device: "winamp",
    deviceLabel: "Winamp",
    layout: "winamp",
  },
  2000: {
    year: 2000,
    id: "y2000-ps2",
    pageLabel: "blue-black console",
    device: "ps2",
    deviceLabel: "PlayStation 2",
    layout: "controller",
  },
  2001: {
    year: 2001,
    id: "y2001-ipod-1g",
    pageLabel: "Aqua iTunes",
    device: "ipod-1g",
    deviceLabel: "iPod 1st gen",
    layout: "touchwheel",
  },
  2002: {
    year: 2002,
    id: "y2002-sidekick",
    pageLabel: "skate messenger",
    device: "sidekick",
    deviceLabel: "Sidekick",
    layout: "handheld",
  },
  2003: {
    year: 2003,
    id: "y2003-ipod-3g",
    pageLabel: "brushed metal iTunes",
    device: "ipod-3g",
    deviceLabel: "iPod 3rd gen",
    layout: "touchwheel",
  },
  2004: {
    year: 2004,
    id: "y2004-razr-myspace",
    pageLabel: "RAZR MySpace chrome",
    device: "razr",
    deviceLabel: "Motorola RAZR",
    layout: "phone",
  },
  2005: {
    year: 2005,
    id: "y2005-ipod-video",
    pageLabel: "scene iPod video",
    device: "ipod-video",
    deviceLabel: "iPod Video",
    layout: "touchwheel",
  },
  2006: {
    year: 2006,
    id: "y2006-wii",
    pageLabel: "Wii showroom",
    device: "wiimote",
    deviceLabel: "Wii Remote",
    layout: "remote",
  },
  2007: {
    year: 2007,
    id: "y2007-iphone",
    pageLabel: "first iPhone glass",
    device: "iphone",
    deviceLabel: "iPhone",
    layout: "glass-phone",
  },
};

export function skinForYear(year: number): YearSkin {
  return YEAR_SKINS[year] ?? YEAR_SKINS[2005];
}
