import { useState } from "react";
import { PlayerProvider } from "./audio/player";
import { Shell } from "./components/Shell";
import { CapsuleScene } from "./components/CapsuleScene";

interface OpenState {
  iso: string;
  year: number;
}

export function App() {
  const [open, setOpen] = useState<OpenState | null>(null);

  return (
    <PlayerProvider>
      {open ? (
        <CapsuleScene
          iso={open.iso}
          year={open.year}
          onYear={(year) => setOpen({ iso: open.iso, year })}
          onClose={() => setOpen(null)}
        />
      ) : (
        <Shell onOpen={(iso, year) => setOpen({ iso, year })} />
      )}
    </PlayerProvider>
  );
}
