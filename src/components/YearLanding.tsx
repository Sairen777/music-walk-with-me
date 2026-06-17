import { useState, type CSSProperties } from "react";
import { usePlayer } from "../audio/player";
import { skinForYear } from "../yearSkins";
import type { Capsule } from "../types";
import "./year-landing.css";

export interface YearLandingProps {
  capsules: Capsule[] | null;
  error: boolean;
  stickerMode: boolean;
  onPickYear: (year: number) => void;
}

function artifactCount(capsule: Capsule): number {
  const a = capsule.artifacts;
  if (!a) return 0;
  return a.films.length + a.games.length + a.gadgets.length;
}

export function YearLanding({ capsules, error, stickerMode, onPickYear }: YearLandingProps) {
  const { current, isPlaying, toggle, next, prev } = usePlayer();
  const [awayOpen, setAwayOpen] = useState(false);

  const years = capsules ? [...capsules].sort((a, b) => a.year - b.year) : [];

  return (
    <main className="year-landing" data-easter={stickerMode ? "stickers" : undefined}>
      <div className="year-landing__inner">
        <header className="year-landing__head">
          <p className="year-landing__wordmark">
            Back in My Days
            <button
              type="button"
              className="year-landing__tld"
              aria-label="Open away message"
              aria-expanded={awayOpen}
              aria-controls="away-message"
              onClick={() => setAwayOpen((v) => !v)}
            >
              .lol
            </button>
          </p>
          <h1>Pick your year</h1>
          <p className="year-landing__tagline">
            USA only for now. Choose a school-year capsule and let the first song hit.
          </p>
        </header>

        {awayOpen && (
          <aside id="away-message" className="year-landing__away" role="status">
            <strong>Away message</strong>
            <span>brb picking the year that rewired my brain</span>
            <span>
              currently: {current ? `${current.title} — ${current.artist}` : "loading the yearbook"}
            </span>
          </aside>
        )}

        {error ? (
          <p className="year-landing__status" role="alert">
            Couldn't load the USA yearbook. Refresh to try again.
          </p>
        ) : capsules === null ? (
          <div className="year-grid" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="year-card year-card--placeholder" style={{ "--i": i } as CSSProperties} />
            ))}
          </div>
        ) : years.length === 0 ? (
          <p className="year-landing__status">No USA years are loaded yet.</p>
        ) : (
          <div className="year-grid">
            {years.map((capsule, index) => {
              const skin = skinForYear(capsule.year);
              const covers = capsule.tracks.slice(0, 3);
              return (
                <button
                  key={capsule.year}
                  type="button"
                  className="year-card"
                  data-skin={skin.id}
                  style={{ "--i": index } as CSSProperties}
                  onClick={() => onPickYear(capsule.year)}
                  aria-label={`Open USA ${capsule.year}: ${capsule.era}`}
                >
                  <span className="year-card__year">{capsule.year}</span>
                  <span className="year-card__skin">{skin.pageLabel}</span>
                  <span className="year-card__covers">
                    {covers.map((t, ci) => (
                      <img
                        key={ci}
                        src={t.artworkUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    ))}
                  </span>
                  <span className="year-card__era">{capsule.era}</span>
                  <span className="year-card__blurb">{capsule.blurb}</span>
                  <span className="year-card__meta">
                    {capsule.tracks.length} songs · {artifactCount(capsule)} artifacts
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {current && (
          <div className="year-landing__mini" role="group" aria-label="Mini player">
            <button
              type="button"
              className="year-landing__mini-btn"
              aria-label="Previous track"
              onClick={prev}
            >
              ◀◀
            </button>
            <button
              type="button"
              className="year-landing__mini-btn"
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={toggle}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              className="year-landing__mini-btn"
              aria-label="Next track"
              onClick={next}
            >
              ▶▶
            </button>
            <span className="year-landing__mini-info">
              Now playing: {current.title} · {current.artist}
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
