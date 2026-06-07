import { usePlayer } from "../audio/player";
import { WorldMap } from "./WorldMap";
import { findCapsule, HERO_ISO, HERO_YEAR } from "../data/capsules";
import "./shell.css";

interface ShellProps {
  onOpen: (iso: string, year: number) => void;
}

export function Shell({ onOpen }: ShellProps) {
  const { playQueue } = usePlayer();
  const hero = findCapsule(HERO_ISO, HERO_YEAR);

  const open = (iso: string) => {
    const capsule = findCapsule(iso, HERO_YEAR);
    if (!capsule || capsule.tracks.length === 0) return;
    // Fire inside the click gesture so the browser permits audio.
    playQueue(capsule.tracks, 0);
    onOpen(iso, HERO_YEAR);
  };

  return (
    <main className="shell" data-on-field data-field="pink">
      <div className="shell__inner">
        <header className="shell__head">
          <h1 className="shell__wordmark">
            Back in My Days<span className="shell__tld">.lol</span>
          </h1>
          <p className="shell__tag">
            Click a country, pick a year, and hear what teenagers were actually
            listening to.
          </p>
        </header>

        <section className="shell__stage" aria-label="Pick a place">
          <WorldMap litIso={HERO_ISO} litLabel="USA" onSelect={open} />
        </section>

        <footer className="shell__foot">
          {hero ? (
            <p>
              Now playing the <strong>{hero.countryName}</strong> capsule:{" "}
              <strong>{hero.year}</strong>, {hero.era}. More years and countries
              are on the way.
            </p>
          ) : (
            <p className="shell__empty">
              No music loaded yet. Run <code>node scripts/hydrate.mjs</code> to
              fill the capsules.
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}
