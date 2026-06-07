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
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
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

  const value = useMemo<PlayerApi>(
    () => ({
      ...state,
      isPlaying: state.status === "playing" || state.status === "loading",
      playQueue,
      toggle,
      next,
      prev,
      seek,
    }),
    [state, playQueue, toggle, next, prev, seek],
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
