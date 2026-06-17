import { type CSSProperties } from "react";
import { usePlayer } from "../audio/player";
import type { YearSkin } from "../yearSkins";
import "./device-player.css";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const m = Math.floor(whole / 60);
  const s = whole % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface DevicePlayerProps {
  onMenu: () => void;
  skin: YearSkin;
}

export function DevicePlayer({ onMenu, skin }: DevicePlayerProps) {
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
    <div
      className="device-player"
      data-device={skin.device}
      data-layout={skin.layout}
      aria-label={`${skin.deviceLabel} player`}
    >
      <div className="device-player__shell">
        <span className="device-player__device-label" aria-hidden="true">
          {skin.deviceLabel}
        </span>
        <div className="device-player__screen" data-status={status}>
          <div className="device-player__statusbar">
            <span
              className={`device-player__eq${isPlaying ? " is-on" : ""}`}
              aria-hidden="true"
            >
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="device-player__np">
              {status === "error"
                ? "Can't load"
                : isPlaying
                  ? "Now Playing"
                  : "Paused"}
            </span>
            <span className="device-player__count">
              {queue.length ? `${index + 1} of ${queue.length}` : "—"}
            </span>
            <span className="device-player__batt" aria-hidden="true" />
          </div>

          {status === "error" && (
            <p className="device-player__error" role="alert">
              Couldn't play this track. Try the next one.
            </p>
          )}

          {current ? (
            <div className="device-player__np-body">
              <img
                className="device-player__cover"
                src={current.artworkUrl}
                alt={`${current.album || current.title} cover art`}
                width={148}
                height={148}
                draggable={false}
              />
              <div className="device-player__meta" role="group" aria-label="Track details">
                <p className="device-player__title" title={current.title}>
                  {current.title}
                </p>
                <p className="device-player__artist" title={current.artist}>
                  {current.artist}
                </p>
                <p className="device-player__album" title={current.album}>
                  {current.album || `${current.releaseYear || ""}`}
                </p>

                <div className="device-player__scrubrow">
                  <input
                    className="device-player__scrub"
                    type="range"
                    min={0}
                    max={total}
                    step={0.05}
                    value={Math.min(currentTime, total)}
                    onChange={(e) => seek(Number(e.target.value))}
                    aria-label="Seek within preview"
                    style={{ "--pct": `${pct}%` } as CSSProperties}
                  />
                  <div className="device-player__times">
                    <span>{formatTime(currentTime)}</span>
                    <span>-{formatTime(Math.max(0, total - currentTime))}</span>
                  </div>
                  <p className="device-player__preview-note">30-second preview</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="device-player__idle">
              <p className="device-player__idle-big">Back in My Days</p>
              <p className="device-player__idle-small">Press a song to start</p>
            </div>
          )}
        </div>

        <div className="device-player__wheel" role="group" aria-label="Player controls">
          <button
            className="device-player__btn device-player__btn--menu"
            type="button"
            onClick={onMenu}
          >
            MENU
          </button>
          <button
            className="device-player__btn device-player__btn--prev"
            type="button"
            onClick={prev}
            aria-label="Previous track"
            title="Previous track"
          >
            <Skip dir="prev" />
          </button>
          <button
            className="device-player__btn device-player__btn--next"
            type="button"
            onClick={next}
            aria-label="Next track"
            title="Next track"
          >
            <Skip dir="next" />
          </button>
          <button
            className="device-player__btn device-player__btn--play"
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
          >
            <PlayPause />
          </button>
          <button
            className="device-player__center"
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
            title={isPlaying ? "Pause" : "Play"}
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
        <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" fill="currentColor" />
      ) : (
        <path d="M6 18l8.5-6L6 6v12zm10-12v12h2V6h-2z" fill="currentColor" />
      )}
    </svg>
  );
}

function PlayPause() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M8 5v14l11-7z"
        fill="currentColor"
      />
    </svg>
  );
}
