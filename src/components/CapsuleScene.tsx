import { usePlayer } from "../audio/player";
import { findCapsule, yearsFor } from "../data/capsules";
import { IpodPlayer } from "./IpodPlayer";
import { AlbumWall } from "./AlbumWall";
import { YearDial } from "./YearDial";
import "./capsule.css";

interface CapsuleSceneProps {
  iso: string;
  year: number;
  onYear: (year: number) => void;
  onClose: () => void;
}

export function CapsuleScene({ iso, year, onYear, onClose }: CapsuleSceneProps) {
  const { playQueue } = usePlayer();
  const capsule = findCapsule(iso, year);
  const years = yearsFor(iso);

  if (!capsule) {
    return (
      <main className="capsule capsule--empty">
        <p>That capsule is empty.</p>
        <button type="button" className="capsule__back" onClick={onClose}>
          Back to the map
        </button>
      </main>
    );
  }

  const changeYear = (next: number) => {
    if (next === year) return;
    const target = findCapsule(iso, next);
    if (target && target.tracks.length) playQueue(target.tracks, 0);
    onYear(next);
  };

  return (
    <main className="capsule" data-field={capsule.field} data-on-field>
      <div className="capsule__bg" aria-hidden="true" />

      <header className="capsule__bar">
        <button type="button" className="capsule__back" onClick={onClose}>
          <span aria-hidden="true">◀</span> Map
        </button>

        <div className="capsule__id">
          <span className="capsule__brand">Back in My Days</span>
          <h1 className="capsule__title">
            {capsule.countryName}, {capsule.year}
          </h1>
        </div>

        <YearDial years={years} value={year} onChange={changeYear} />
      </header>

      <p className="capsule__blurb">{capsule.blurb}</p>

      <div className="capsule__stage" key={`${iso}-${year}`}>
        <aside className="capsule__player">
          <IpodPlayer onMenu={onClose} />
        </aside>

        <section
          className="capsule__wall"
          aria-label={`${capsule.countryName} ${capsule.year} tracks`}
        >
          <div className="capsule__wallhead">
            <h2 className="capsule__wallhead-title">{capsule.era}</h2>
            <p className="capsule__wallhead-sub">
              {capsule.tracks.length} songs &middot; tap a cover to play
            </p>
          </div>
          <AlbumWall tracks={capsule.tracks} />
        </section>
      </div>
    </main>
  );
}
