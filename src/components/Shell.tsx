import { useMemo } from "react";
import { usePlayer } from "../audio/player";
import { WorldMap } from "./WorldMap";
import type { CountryIndex } from "../types";
import "./shell.css";

interface ShellProps {
  countries: CountryIndex[] | null;
  error: boolean;
  onOpen: (iso: string, countryName: string, year: number, initialPlaybackKey?: string) => void;
}

export function Shell({ countries, error, onOpen }: ShellProps) {
  const { playQueue, unlock } = usePlayer();

  const mapCountries = useMemo(
    () => (countries ?? []).map((c) => ({ iso: c.iso, label: c.countryName })),
    [countries],
  );

  const open = (iso: string) => {
    const entry = countries?.find((c) => c.iso === iso);
    if (!entry) return;
    const initialPlaybackKey = entry.heroTrack ? `${entry.iso}-${entry.heroYear}` : undefined;
    if (entry.heroTrack) {
      // Start a real preview inside the click. The full country shard still loads
      // on demand after navigation, but the product loop gets sound immediately.
      playQueue([entry.heroTrack], 0);
    } else {
      unlock();
    }
    onOpen(iso, entry.countryName, entry.heroYear, initialPlaybackKey);
  };

  const names = (countries ?? []).map((c) => c.countryName).join(" and ");

  return (
    <main className="shell">
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
          {error ? (
            <p className="shell__status" role="alert">
              Couldn't load the map. Refresh to try again.
            </p>
          ) : countries ? (
            <WorldMap countries={mapCountries} onSelect={open} />
          ) : (
            <p className="shell__status">Loading the map&hellip;</p>
          )}
        </section>

        <footer className="shell__foot">
          {countries && countries.length > 0 && (
            <p>
              Lit up so far: <strong>{names}</strong>. Click one to drop in. More
              countries and years are on the way.
            </p>
          )}
        </footer>
      </div>
    </main>
  );
}
