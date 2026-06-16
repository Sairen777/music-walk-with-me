import { useCallback, useEffect, useState } from "react";
import { PlayerProvider, usePlayer } from "./audio/player";
import { CapsuleScene } from "./components/CapsuleScene";
import { YearLanding } from "./components/YearLanding";
import { NostalgiaStickers } from "./components/NostalgiaStickers";
import { loadCountry } from "./data/capsules";
import type { Capsule } from "./types";

interface SelectedYear {
  year: number;
  initialPlaybackKey?: string;
}

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
] as const;

function UsaExperience() {
  const [capsules, setCapsules] = useState<Capsule[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<SelectedYear | null>(null);
  const [stickerMode, setStickerMode] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const { playQueue, unlock } = usePlayer();

  // Konami code Easter egg
  const [konamiIdx, setKonamiIdx] = useState(0);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const expected = KONAMI[konamiIdx];
      const matches =
        (expected === "ArrowUp" && e.key === "ArrowUp") ||
        (expected === "ArrowDown" && e.key === "ArrowDown") ||
        (expected === "ArrowLeft" && e.key === "ArrowLeft") ||
        (expected === "ArrowRight" && e.key === "ArrowRight") ||
        (expected === "b" && e.key.toLowerCase() === "b") ||
        (expected === "a" && e.key.toLowerCase() === "a");
      if (matches) {
        const next = konamiIdx + 1;
        if (next === KONAMI.length) {
          setStickerMode(true);
          setKonamiIdx(0);
          setToast("Cheat code accepted: stickers unlocked");
          setTimeout(() => setToast(null), 2200);
        } else {
          setKonamiIdx(next);
        }
      } else {
        setKonamiIdx(0);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [konamiIdx]);

  // Load USA capsules once
  useEffect(() => {
    let alive = true;
    loadCountry("USA").then(
      (data) => alive && setCapsules(data),
      () => alive && setLoadError(true),
    );
    return () => {
      alive = false;
    };
  }, []);

  const pickYear = useCallback(
    (year: number) => {
      const capsule = capsules?.find((c) => c.year === year);
      if (!capsule) {
        unlock();
        return;
      }
      playQueue(capsule.tracks, 0);
      setSelected({ year, initialPlaybackKey: `${capsule.iso}-${capsule.year}` });
    },
    [capsules, playQueue, unlock],
  );

  return (
    <>
      {selected ? (
        <CapsuleScene
          capsules={capsules ?? []}
          year={selected.year}
          initialPlaybackKey={selected.initialPlaybackKey}
          stickerMode={stickerMode}
          onYear={(year) => setSelected({ year })}
          onBack={() => setSelected(null)}
        />
      ) : (
        <YearLanding
          capsules={capsules}
          error={loadError}
          stickerMode={stickerMode}
          onPickYear={pickYear}
        />
      )}
      <NostalgiaStickers active={stickerMode} />
      {toast && (
        <div className="app-toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}

export function App() {
  return (
    <PlayerProvider>
      <UsaExperience />
    </PlayerProvider>
  );
}
