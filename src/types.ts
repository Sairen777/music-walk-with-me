/** The vivid iPod-ad color field each era owns. */
export type FieldKey = "pink" | "lime" | "cyan" | "orange" | "blue";

/** Editorial seed: what teens actually blasted. Authored by hand. */
export interface SeedTrack {
  artist: string;
  title: string;
  /** Optional iTunes search hint when the plain "artist title" query is ambiguous. */
  hint?: string;
}

export interface EraSeed {
  /** ISO 3166-1 alpha-3 country code, matched against the map geometry. */
  iso: string;
  /** Display name, e.g. "USA". */
  countryName: string;
  year: number;
  /** Short era label, e.g. "scene / pop-punk". */
  era: string;
  field: FieldKey;
  /** Second-person capsule subtitle, e.g. "Homeroom, 2005." */
  blurb: string;
  tracks: SeedTrack[];
}

/** A track after build-time hydration from the iTunes Search API. */
export interface HydratedTrack {
  id: string;
  artist: string;
  title: string;
  album: string;
  /** 600px square artwork. */
  artworkUrl: string;
  /** 30-second AAC preview. */
  previewUrl: string;
  releaseYear: number;
  durationMs: number;
}

/** A fully hydrated, ready-to-play capsule. Shape of every entry in capsules.json. */
export interface Capsule {
  iso: string;
  countryName: string;
  year: number;
  era: string;
  field: FieldKey;
  blurb: string;
  tracks: HydratedTrack[];
}
