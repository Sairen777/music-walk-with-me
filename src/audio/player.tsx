import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { HydratedTrack } from "../types";

/** A 1-sample silent WAV. Playing it inside a user gesture "unlocks" the audio
 * element so a later play() (after an async fetch) isn't blocked by autoplay rules. */
const SILENT_WAV = (() => {
  const view = new DataView(new ArrayBuffer(45));
  const tag = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  tag(0, "RIFF"); view.setUint32(4, 37, true); tag(8, "WAVE");
  tag(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, 8000, true); view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  tag(36, "data"); view.setUint32(40, 1, true); view.setUint8(44, 128);
  let binary = "";
  for (const byte of new Uint8Array(view.buffer)) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
})();

export type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

interface PlayerState {
  current: HydratedTrack | null;
  queue: HydratedTrack[];
  index: number;
  status: PlayerStatus;
  currentTime: number;
  duration: number;
}

interface PlayerApi extends PlayerState {
  isPlaying: boolean;
  /** Load a queue and start at startIndex. Call inside a user gesture to allow audio. */
  playQueue: (tracks: HydratedTrack[], startIndex: number) => void;
  /** Replace queue metadata without touching the active audio element. */
  adoptQueue: (tracks: HydratedTrack[], preferredIndex: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  /** Play a silent blip inside a gesture so a later async play() isn't blocked. */
  unlock: () => void;
}

const PlayerContext = createContext<PlayerApi | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<PlayerState>({
    current: null,
    queue: [],
    index: -1,
    status: "idle",
    currentTime: 0,
    duration: 0,
  });

  // Keep a live ref to queue/index so transport callbacks stay stable.
  const queueRef = useRef<HydratedTrack[]>([]);
  const indexRef = useRef(-1);
  // Latest-advance ref so the audio "ended" listener never goes stale.
  const advanceRef = useRef<(delta: number) => void>(() => {});

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTime = () => setState((s) => ({ ...s, currentTime: audio.currentTime }));
    const onMeta = () =>
      setState((s) => ({ ...s, duration: Number.isFinite(audio.duration) ? audio.duration : 0 }));
    const onPlay = () => setState((s) => ({ ...s, status: "playing" }));
    const onPause = () =>
      setState((s) => (s.status === "error" ? s : { ...s, status: "paused" }));
    const onWaiting = () => setState((s) => ({ ...s, status: "loading" }));
    const onError = () => setState((s) => ({ ...s, status: "error" }));
    const onEnded = () => advanceRef.current(1);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("playing", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("playing", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("ended", onEnded);
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  const load = useCallback((track: HydratedTrack, idx: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    indexRef.current = idx;
    setState((s) => ({
      ...s,
      current: track,
      index: idx,
      status: "loading",
      currentTime: 0,
      duration: 0,
    }));
    audio.src = track.previewUrl;
    audio.currentTime = 0;
    const p = audio.play();
    if (p) p.catch(() => setState((s) => ({ ...s, status: "paused" })));
  }, []);

  const advance = useCallback(
    (delta: number) => {
      const q = queueRef.current;
      if (q.length === 0) return;
      const nextIdx = indexRef.current + delta;
      if (nextIdx < 0 || nextIdx >= q.length) {
        // Past the ends: stop at boundary, keep last track loaded but paused.
        audioRef.current?.pause();
        return;
      }
      load(q[nextIdx], nextIdx);
    },
    [load],
  );

  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  const playQueue = useCallback(
    (tracks: HydratedTrack[], startIndex: number) => {
      if (tracks.length === 0) return;
      const idx = Math.max(0, Math.min(startIndex, tracks.length - 1));
      queueRef.current = tracks;
      setState((s) => ({ ...s, queue: tracks }));
      load(tracks[idx], idx);
    },
    [load],
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) {
      // Nothing loaded yet: start the queue if we have one.
      if (queueRef.current.length) load(queueRef.current[0], 0);
      return;
    }
    if (audio.paused) {
      const p = audio.play();
      if (p) p.catch(() => setState((s) => ({ ...s, status: "paused" })));
    } else {
      audio.pause();
    }
  }, [load]);

  const next = useCallback(() => advance(1), [advance]);
  const prev = useCallback(() => {
    const audio = audioRef.current;
    // Restart current track if we're past the first few seconds (CD-player feel).
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    advance(-1);
  }, [advance]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(seconds)) {
      audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || seconds));
    }
  }, []);

  const adoptQueue = useCallback((tracks: HydratedTrack[], preferredIndex: number) => {
    if (tracks.length === 0) return;
    setState((s) => {
      const currentIndex = s.current
        ? tracks.findIndex((track) => track.id === s.current?.id)
        : -1;
      const idx = currentIndex >= 0
        ? currentIndex
        : Math.max(0, Math.min(preferredIndex, tracks.length - 1));
      queueRef.current = tracks;
      indexRef.current = idx;
      return {
        ...s,
        queue: tracks,
        index: idx,
        current: currentIndex >= 0 ? s.current : tracks[idx],
      };
    });
  }, []);

  const unlockedRef = useRef(false);
  const unlock = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || unlockedRef.current) return;
    unlockedRef.current = true;
    audio.src = SILENT_WAV;
    const p = audio.play();
    if (p) p.then(() => {
      if (audio.src === SILENT_WAV) audio.pause();
    }).catch(() => {});
  }, []);

  const value = useMemo<PlayerApi>(
    () => ({
      ...state,
      isPlaying: state.status === "playing" || state.status === "loading",
      playQueue,
      adoptQueue,
      toggle,
      next,
      prev,
      seek,
      unlock,
    }),
    [state, playQueue, adoptQueue, toggle, next, prev, seek, unlock],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

// Provider + hook live together by design; fast-refresh only flags the co-located hook.
// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer(): PlayerApi {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
