import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../audio/player";
import { loadCountry } from "../data/capsules";
import { IpodPlayer } from "./IpodPlayer";
import { AlbumWall } from "./AlbumWall";
import { YearDial } from "./YearDial";
import type { Capsule } from "../types";
import "./capsule.css";

interface CapsuleSceneProps {
  iso: string;
  countryName: string;
  year: number;
  initialPlaybackKey?: string;
  onYear: (year: number) => void;
  onClose: () => void;
}

export function CapsuleScene({
  iso,
  countryName,
  year,
  initialPlaybackKey,
  onYear,
  onClose,
}: CapsuleSceneProps) {
  const { playQueue, adoptQueue, unlock } = usePlayer();
  // Tag loaded data with its iso so a stale country's data never shows during a switch,
  // and we avoid resetting state synchronously inside the effect.
  const [loaded, setLoaded] = useState<{ iso: string; capsules: Capsule[] } | null>(null);
  const [failedIso, setFailedIso] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadCountry(iso).then(
      (data) => alive && setLoaded({ iso, capsules: data }),
      () => alive && setFailedIso(iso),
    );
    return () => {
      alive = false;
    };
  }, [iso]);

  const capsules = loaded && loaded.iso === iso ? loaded.capsules : null;
  const error = failedIso === iso;
  const capsule = capsules?.find((c) => c.year === year);
  const years = capsules?.map((c) => c.year) ?? [];

  // Autoplay whenever the resolved capsule (country + year) changes. If Shell
  // already started the hero preview inside the country click, just adopt the
  // full queue metadata without touching the active audio.
  const lastPlayed = useRef(initialPlaybackKey ?? "");
  useEffect(() => {
    if (!capsule) return;
    const key = `${capsule.iso}-${capsule.year}`;
    if (lastPlayed.current === key) {
      adoptQueue(capsule.tracks, 0);
      return;
    }
    lastPlayed.current = key;
    playQueue(capsule.tracks, 0);
  }, [capsule, playQueue, adoptQueue]);

  const changeYear = (next: number) => {
    if (next === year) return;
    const target = capsules?.find((c) => c.year === next);
    if (target) {
      // Year changes happen after the country shard is already loaded, so start
      // playback inside the button gesture instead of waiting for an effect.
      lastPlayed.current = `${target.iso}-${target.year}`;
      playQueue(target.tracks, 0);
    } else {
      unlock();
    }
    onYear(next);
  };

  return (
    <main className="capsule" data-field={capsule?.field} data-on-field>
      <div className="capsule__bg" aria-hidden="true" />

      <header className="capsule__bar">
        <button type="button" className="capsule__back" onClick={onClose}>
          <span aria-hidden="true">◀</span> Map
        </button>

        <div className="capsule__id">
          <span className="capsule__brand">Back in My Days</span>
          <h1 className="capsule__title">
            {countryName}, {year}
          </h1>
        </div>

        {years.length > 0 && (
          <YearDial years={years} value={year} onChange={changeYear} />
        )}
      </header>

      {capsule && <p className="capsule__blurb">{capsule.blurb}</p>}

      <div className="capsule__stage" key={`${iso}-${year}`}>
        {error ? (
          <p className="capsule__status" role="alert">
            Couldn't load this capsule. Go back to the map and try again.
          </p>
        ) : capsule ? (
          <>
            <aside className="capsule__player">
              <IpodPlayer onMenu={onClose} />
            </aside>
            <section
              className="capsule__wall"
              aria-label={`${countryName} ${year} tracks`}
            >
              <div className="capsule__wallhead">
                <h2 className="capsule__wallhead-title">{capsule.era}</h2>
                <p className="capsule__wallhead-sub">
                  {capsule.tracks.length} songs &middot; tap a cover to play
                </p>
              </div>
              <AlbumWall tracks={capsule.tracks} />
            </section>
          </>
        ) : (
          <p className="capsule__status">Loading the capsule&hellip;</p>
        )}
      </div>
    </main>
  );
}
