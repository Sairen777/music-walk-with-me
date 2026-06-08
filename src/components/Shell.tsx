import { usePlayer } from "../audio/player";
import { WorldMap } from "./WorldMap";
import { activeCountries, findCapsule, heroYearFor } from "../data/capsules";
import "./shell.css";

interface ShellProps {
  onOpen: (iso: string, year: number) => void;
}

export function Shell({ onOpen }: ShellProps) {
  const { playQueue } = usePlayer();

  const open = (iso: string) => {
    const year = heroYearFor(iso);
    const capsule = findCapsule(iso, year);
    if (!capsule || capsule.tracks.length === 0) return;
    // Fire inside the click gesture so the browser permits audio.
    playQueue(capsule.tracks, 0);
    onOpen(iso, year);
  };

  const names = activeCountries.map((c) => c.label).join(" and ");

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
          <WorldMap countries={activeCountries} onSelect={open} />
        </section>

        <footer className="shell__foot">
          {activeCountries.length ? (
            <p>
              Lit up so far: <strong>{names}</strong>. Click one to drop in. More
              countries and years are on the way.
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
