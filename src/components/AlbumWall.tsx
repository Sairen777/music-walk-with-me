import { memo, useCallback, type CSSProperties } from "react";
import { usePlayer } from "../audio/player";
import type { HydratedTrack } from "../types";
import "./wall.css";

interface AlbumWallProps {
  tracks: HydratedTrack[];
}

export function AlbumWall({ tracks }: AlbumWallProps) {
  const { current, isPlaying, playQueue } = usePlayer();
  const play = useCallback((index: number) => playQueue(tracks, index), [playQueue, tracks]);

  return (
    <ul className="wall" aria-label="Album wall">
      {tracks.map((track, index) => (
        <AlbumTile
          key={track.id}
          track={track}
          index={index}
          isCurrent={current?.id === track.id}
          isPlaying={isPlaying && current?.id === track.id}
          onPlay={play}
        />
      ))}
    </ul>
  );
}

interface AlbumTileProps {
  track: HydratedTrack;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: (index: number) => void;
}

const AlbumTile = memo(function AlbumTile({
  track,
  index,
  isCurrent,
  isPlaying,
  onPlay,
}: AlbumTileProps) {
  return (
    <li
      className={`wall__tile${isCurrent ? " is-current" : ""}`}
      style={{ "--i": index } as CSSProperties}
    >
      <button
        className="wall__btn"
        type="button"
        onClick={() => onPlay(index)}
        aria-label={`Play ${track.title} by ${track.artist}`}
        aria-pressed={isCurrent}
      >
        <img
          className="wall__cover"
          src={track.artworkUrl}
          alt=""
          loading="lazy"
          decoding="async"
          width={300}
          height={300}
          draggable={false}
        />
        <span className="wall__scrim">
          <span className="wall__title">{track.title}</span>
          <span className="wall__artist">{track.artist}</span>
        </span>
        <span className="wall__play" aria-hidden="true" />
        {isCurrent && (
          <span className={`wall__badge${isPlaying ? " is-playing" : ""}`} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </button>
    </li>
  );
});
