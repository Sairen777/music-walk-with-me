import type { Capsule } from "../types";
import type { YearSkin } from "../yearSkins";

export interface YearSouvenirPanelProps {
  capsule: Capsule;
  skin: YearSkin;
}

export function YearSouvenirPanel({ capsule, skin }: YearSouvenirPanelProps) {
  const firstTrack = capsule.tracks[0];
  const artifacts = capsule.artifacts;
  const firstFilm = artifacts?.films[0];
  const firstGame = artifacts?.games[0];
  const firstGadget = artifacts?.gadgets[0];

  return (
    <section
      className="capsule__souvenirs"
      aria-label={`USA ${capsule.year} nostalgia notes`}
    >
      <div className="capsule__souvenir-head">
        <span className="capsule__souvenir-kicker">Yearbook scraps</span>
        <h2 className="capsule__souvenir-title">What was in the air</h2>
      </div>
      <ul className="souvenir-list">
        {firstTrack && (
          <li className="souvenir-list__item">
            <span className="souvenir-list__label">First song loaded</span>
            <span className="souvenir-list__value">
              {firstTrack.title} · {firstTrack.artist}
            </span>
          </li>
        )}
        <li className="souvenir-list__item">
          <span className="souvenir-list__label">Device shell</span>
          <span className="souvenir-list__value">{skin.deviceLabel}</span>
        </li>
        {firstFilm && (
          <li className="souvenir-list__item">
            <span className="souvenir-list__label">Movie-night poster</span>
            <span className="souvenir-list__value">{firstFilm.title}</span>
          </li>
        )}
        {firstGame && (
          <li className="souvenir-list__item">
            <span className="souvenir-list__label">Rental-counter pick</span>
            <span className="souvenir-list__value">{firstGame.title}</span>
          </li>
        )}
        {firstGadget && (
          <li className="souvenir-list__item">
            <span className="souvenir-list__label">Backpack tech</span>
            <span className="souvenir-list__value">{firstGadget.title}</span>
          </li>
        )}
      </ul>
    </section>
  );
}
