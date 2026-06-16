import { type CSSProperties } from "react";
import "./nostalgia.css";

export interface NostalgiaStickersProps {
  active: boolean;
}

export function NostalgiaStickers({ active }: NostalgiaStickersProps) {
  if (!active) return null;

  return (
    <div className="nostalgia-stickers" aria-hidden="true">
      {["BRB", "AIM", "TRL", "Top 8", "burned CD", "Kazaa?"].map((label, index) => (
        <span
          key={label}
          className="nostalgia-stickers__sticker"
          style={{ "--i": index } as CSSProperties}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
