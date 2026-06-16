import { type CSSProperties } from "react";
import type { EraArtifacts, FilmArtifact, GameArtifact, GadgetArtifact } from "../types";

interface ArtifactsPanelProps {
  artifacts: EraArtifacts;
  year: number;
}

export function ArtifactsPanel({ artifacts, year }: ArtifactsPanelProps) {
  return (
    <section className="capsule__artifacts" aria-label={`Pop-culture shelf for ${year}`}>
      <div className="capsule__artifacts-head">
        <h3 className="capsule__artifacts-title">Pop-culture shelf</h3>
        <p className="capsule__artifacts-sub">posters, cartridges, gadgets</p>
      </div>
      {artifacts.films.length > 0 && (
        <ArtifactSection title="Movie night">
          {artifacts.films.map((f, index) => (
            <FilmCard key={f.title} film={f} index={index} />
          ))}
        </ArtifactSection>
      )}
      {artifacts.games.length > 0 && (
        <ArtifactSection title="Rental counter">
          {artifacts.games.map((g, index) => (
            <GameCard key={g.title} game={g} index={index} />
          ))}
        </ArtifactSection>
      )}
      {artifacts.gadgets.length > 0 && (
        <ArtifactSection title="Backpack tech">
          {artifacts.gadgets.map((d, index) => (
            <GadgetCard key={d.title} gadget={d} index={index} />
          ))}
        </ArtifactSection>
      )}
    </section>
  );
}

function ArtifactSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="artifact-wall__section">
      <h4 className="artifact-wall__cat">{title}</h4>
      <div className="artifact-wall">{children}</div>
    </div>
  );
}

function FilmCard({ film, index }: { film: FilmArtifact; index: number }) {
  if (film.trailerUrl) {
    return (
      <a
        className="artifact-wall__tile artifact-wall__card"
        href={film.trailerUrl}
        target="_blank"
        rel="noreferrer"
        style={{ "--i": index } as CSSProperties}
      >
        <img
          className="artifact-wall__image"
          src={film.posterUrl}
          alt={`${film.title} poster`}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <div className="artifact-wall__scrim">
          <span className="artifact-wall__title">{film.title}</span>
          <span className="artifact-wall__chip">Trailer</span>
        </div>
      </a>
    );
  }

  return (
    <article
      className="artifact-wall__tile artifact-wall__card"
      style={{ "--i": index } as CSSProperties}
    >
      <img
        className="artifact-wall__image"
        src={film.posterUrl}
        alt={`${film.title} poster`}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <div className="artifact-wall__scrim">
        <span className="artifact-wall__title">{film.title}</span>
      </div>
    </article>
  );
}

function GameCard({ game, index }: { game: GameArtifact; index: number }) {
  const shots = game.screenshots.slice(0, 3);

  if (game.trailerUrl) {
    return (
      <a
        className="artifact-wall__tile artifact-wall__card"
        href={game.trailerUrl}
        target="_blank"
        rel="noreferrer"
        style={{ "--i": index } as CSSProperties}
      >
        <img
          className="artifact-wall__image"
          src={game.coverUrl}
          alt={`${game.title} cover`}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <div className="artifact-wall__scrim">
          <span className="artifact-wall__title">{game.title}</span>
          <span className="artifact-wall__chip">Trailer</span>
        </div>
        {shots.length > 0 && (
          <div className="artifact-wall__shots">
            {shots.map((s, i) => (
              <img
                key={i}
                className="artifact-wall__shot"
                src={s.imageUrl}
                alt={s.alt}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ))}
          </div>
        )}
      </a>
    );
  }

  return (
    <article
      className="artifact-wall__tile artifact-wall__card"
      style={{ "--i": index } as CSSProperties}
    >
      <img
        className="artifact-wall__image"
        src={game.coverUrl}
        alt={`${game.title} cover`}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <div className="artifact-wall__scrim">
        <span className="artifact-wall__title">{game.title}</span>
      </div>
      {shots.length > 0 && (
        <div className="artifact-wall__shots">
          {shots.map((s, i) => (
            <img
              key={i}
              className="artifact-wall__shot"
              src={s.imageUrl}
              alt={s.alt}
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function GadgetCard({ gadget, index }: { gadget: GadgetArtifact; index: number }) {
  return (
    <article
      className="artifact-wall__tile artifact-wall__card"
      style={{ "--i": index } as CSSProperties}
    >
      <img
        className="artifact-wall__image"
        src={gadget.imageUrl}
        alt={`${gadget.title}`}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <div className="artifact-wall__scrim">
        <span className="artifact-wall__title">{gadget.title}</span>
        {gadget.description && (
          <span className="artifact-wall__meta">{gadget.description}</span>
        )}
      </div>
    </article>
  );
}
