/**
 * Shared text normalization for music track matching.
 *
 * Every function in this module is pure: same input → same output. No I/O, no
 * caching, no external state.
 */

// RU is the Cyrillic-to-Latin map used by norm()
export const RU = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s",
  т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

/**
 * Fold a string into searchable form: lowercase, decompose diacritics, strip
 * combining marks, replace ampersands, transliterate Cyrillic, and collapse
 * every run of non-alphanumeric characters into a single space.
 */
export function norm(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[\u0400-\u04ff]/g, (ch) => RU[ch] ?? "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Normalize and apply the single observed canonical alias.
 *
 * The only alias is "p nk" → "pink" so that "P!nk" and "Pink" compare equal
 * after punctuation is stripped.  Do NOT add a broad alias table here; any
 * future alias must be observed in real source/iTunes data first.
 */
export function canonicalName(value) {
  const n = norm(value);
  if (n === "p nk") return "pink";
  return n;
}

/**
 * Produce a URL-safe slug, capped at 60 characters for filesystem safety.
 */
export function slug(s) {
  return norm(s)
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

/**
 * Drop parenthetical / bracketed qualifiers (e.g. "(feat. …)", "[Live]",
 * "{Single Edit}") before normalizing, giving the "core" of a title.
 */
export function coreOf(s) {
  return norm(s.replace(/[([{][^)\]}]*[)\]}]/g, " "));
}

/**
 * Stable composite key for an (artist, title) pair.  Used to group signals
 * from different sources that refer to the same recording.
 */
export function trackKey(artist, title) {
  return `${leadArtistKey(artist)}--${coreOf(title) || canonicalName(title)}`;
}

/**
 * Normalize an artist name into a lead-artist key: strip trailing featured-
 * credit clauses, then apply canonicalName.  Ampersands are NOT split because
 * real artist names (e.g. "Simon & Garfunkel") use them.
 */
export function leadArtistKey(artist) {
  return canonicalName(
    artist.replace(/\s+(?:featuring|feat\.?|ft\.?|f\/|with)\s+.+$/i, ""),
  );
}
