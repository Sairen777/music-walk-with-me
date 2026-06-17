import { useEffect, useRef } from "react";
import { usePlayer } from "../audio/player";
import { DevicePlayer } from "./DevicePlayer";
import { AlbumWall } from "./AlbumWall";
import { ArtifactsPanel } from "./ArtifactsPanel";
import { InternetArtifactsPanel } from "./InternetArtifactsPanel";
import { internetForYear } from "../data/yearInternet";
import { YearDial } from "./YearDial";
import { YearSouvenirPanel } from "./YearSouvenirPanel";
import { skinForYear } from "../yearSkins";
import type { Capsule } from "../types";
import "./capsule.css";
import "./year-skins.css";

interface CapsuleSceneProps {
  capsules: Capsule[];
  year: number;
  initialPlaybackKey?: string;
  stickerMode: boolean;
  onYear: (year: number) => void;
  onBack: () => void;
}

export function CapsuleScene({
  capsules,
  year,
  initialPlaybackKey,
  stickerMode,
  onYear,
  onBack,
}: CapsuleSceneProps) {
  const { playQueue, adoptQueue, unlock } = usePlayer();

  const capsule = capsules.find((c) => c.year === year);
  const years = capsules.map((c) => c.year);
  const skin = skinForYear(capsule?.year ?? year);
  const internetArtifacts = internetForYear(capsule?.year ?? year);

  // Autoplay whenever the resolved capsule (country + year) changes.
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
    const target = capsules.find((c) => c.year === next);
    if (target) {
      lastPlayed.current = `${target.iso}-${target.year}`;
      playQueue(target.tracks, 0);
    } else {
      unlock();
    }
    onYear(next);
  };

  return (
    <main
      className="capsule"
      data-field={capsule?.field}
      data-skin={skin.id}
      data-easter={stickerMode ? "stickers" : undefined}
      data-on-field
    >
      <div className="capsule__bg" aria-hidden="true" />

      <header className="capsule__bar">
        <button type="button" className="capsule__back" onClick={onBack} aria-label="Back to yearbook picker">
          <span aria-hidden="true">◀</span> Back to yearbook
        </button>

        <div className="capsule__id">
          <span className="capsule__brand">USA Yearbook</span>
          <h1 className="capsule__title">{year}</h1>
        </div>

        {years.length > 0 && (
          <YearDial years={years} value={year} onChange={changeYear} />
        )}
      </header>

      {capsule && <p className="capsule__blurb">{capsule.blurb}</p>}

      <div className="capsule__stage" key={`${year}`}>
        {capsule ? (
          <>
            <aside className="capsule__player">
              <DevicePlayer onMenu={onBack} skin={skin} />
            </aside>
            <YearSouvenirPanel capsule={capsule} skin={skin} />
            <section
              className="capsule__wall"
              aria-label="Album wall — tap a cover to play"
            >
              <div className="capsule__wallhead">
                <h2 className="capsule__wallhead-title">{capsule.era}</h2>
                <p className="capsule__wallhead-sub">
                  {capsule.tracks.length} songs &middot; tap a cover to play
                </p>
              </div>
              <AlbumWall tracks={capsule.tracks} />
            </section>
            {capsule.artifacts && (
              <ArtifactsPanel artifacts={capsule.artifacts} year={capsule.year} />
            )}
            <InternetArtifactsPanel items={internetArtifacts} year={year} />
          </>
        ) : (
          <p className="capsule__status" role="alert">
            We don't have this year yet. Pick another one.
          </p>
        )}
      </div>
    </main>
  );
}
