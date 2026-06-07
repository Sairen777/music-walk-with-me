import { type CSSProperties } from "react";
import { usePlayer } from "../audio/player";
import "./ipod.css";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface IpodPlayerProps {
  onMenu: () => void;
}

export function IpodPlayer({ onMenu }: IpodPlayerProps) {
  const {
    current,
    queue,
    index,
    status,
    currentTime,
    duration,
    isPlaying,
    toggle,
    next,
    prev,
    seek,
  } = usePlayer();

  const total = duration || 30;
  const pct = total > 0 ? Math.min(100, (currentTime / total) * 100) : 0;

  return (
    <div className="ipod" aria-label="iPod player">
      <div className="ipod__shell">
        <div className="ipod__screen" data-status={status}>
          <div className="ipod__statusbar">
            <span className={`ipod__eq${isPlaying ? " is-on" : ""}`} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="ipod__np">
              {status === "error" ? "Can't load" : isPlaying ? "Now Playing" : "Paused"}
            </span>
            <span className="ipod__count">
              {queue.length ? `${index + 1} of ${queue.length}` : "—"}
            </span>
            <span className="ipod__batt" aria-hidden="true" />
          </div>

          {current ? (
            <div className="ipod__np-body">
              <img
                className="ipod__cover"
                src={current.artworkUrl}
                alt={`${current.album || current.title} cover art`}
                width={148}
                height={148}
                draggable={false}
              />
              <div className="ipod__meta">
                <p className="ipod__title" title={current.title}>
                  {current.title}
                </p>
                <p className="ipod__artist" title={current.artist}>
                  {current.artist}
                </p>
                <p className="ipod__album" title={current.album}>
                  {current.album || `${current.releaseYear || ""}`}
                </p>

                <div className="ipod__scrubrow">
                  <input
                    className="ipod__scrub"
                    type="range"
                    min={0}
                    max={total}
                    step={0.05}
                    value={Math.min(currentTime, total)}
                    onChange={(e) => seek(Number(e.target.value))}
                    aria-label="Seek within preview"
                    style={{ "--pct": `${pct}%` } as CSSProperties}
                  />
                  <div className="ipod__times">
                    <span>{formatTime(currentTime)}</span>
                    <span>-{formatTime(Math.max(0, total - currentTime))}</span>
                  </div>
                  <p className="ipod__preview-note">30-second preview</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="ipod__idle">
              <p className="ipod__idle-big">Back in My Days</p>
              <p className="ipod__idle-small">Press a song to start</p>
            </div>
          )}
        </div>

        <div className="ipod__wheel" role="group" aria-label="Player controls">
          <button className="ipod__btn ipod__btn--menu" type="button" onClick={onMenu}>
            MENU
          </button>
          <button
            className="ipod__btn ipod__btn--prev"
            type="button"
            onClick={prev}
            aria-label="Previous track"
          >
            <Skip dir="prev" />
          </button>
          <button
            className="ipod__btn ipod__btn--next"
            type="button"
            onClick={next}
            aria-label="Next track"
          >
            <Skip dir="next" />
          </button>
          <button
            className="ipod__btn ipod__btn--play"
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <PlayPause />
          </button>
          <button
            className="ipod__center"
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
            aria-pressed={isPlaying}
          />
        </div>
      </div>
    </div>
  );
}

function Skip({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      {dir === "prev" ? (
        <path
          fill="currentColor"
          d="M7 6h2v12H7zM20 6v12l-9-6zM11 6v12l-2-1.3V7.3z"
        />
      ) : (
        <path
          fill="currentColor"
          d="M15 6h2v12h-2zM4 6l9 6-9 6zM13 6l2 1.3v9.4L13 18z"
        />
      )}
    </svg>
  );
}

function PlayPause() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path fill="currentColor" d="M5 5h3v14H5zM10 5h3v14h-3z" />
      <path fill="currentColor" d="M16 5l7 7-7 7z" />
    </svg>
  );
}
