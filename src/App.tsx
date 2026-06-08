import { useEffect, useState } from "react";
import { PlayerProvider } from "./audio/player";
import { Shell } from "./components/Shell";
import { CapsuleScene } from "./components/CapsuleScene";
import { loadIndex } from "./data/capsules";
import type { CountryIndex } from "./types";

interface OpenState {
  iso: string;
  countryName: string;
  year: number;
  initialPlaybackKey?: string;
}

export function App() {
  const [index, setIndex] = useState<CountryIndex[] | null>(null);
  const [indexError, setIndexError] = useState(false);
  const [open, setOpen] = useState<OpenState | null>(null);

  useEffect(() => {
    let alive = true;
    loadIndex().then(
      (data) => alive && setIndex(data),
      () => alive && setIndexError(true),
    );
    return () => {
      alive = false;
    };
  }, []);

  return (
    <PlayerProvider>
      {open ? (
        <CapsuleScene
          iso={open.iso}
          countryName={open.countryName}
          year={open.year}
          initialPlaybackKey={open.initialPlaybackKey}
          onYear={(year) => setOpen({ ...open, year })}
          onClose={() => setOpen(null)}
        />
      ) : (
        <Shell
          countries={index}
          error={indexError}
          onOpen={(iso, countryName, year, initialPlaybackKey) =>
            setOpen({ iso, countryName, year, initialPlaybackKey })
          }
        />
      )}
    </PlayerProvider>
  );
}
