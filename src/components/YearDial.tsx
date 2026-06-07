import { type KeyboardEvent } from "react";
import "./dial.css";

interface YearDialProps {
  years: number[];
  value: number;
  onChange: (year: number) => void;
}

export function YearDial({ years, value, onChange }: YearDialProps) {
  const idx = years.indexOf(value);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let target: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        target = Math.min(years.length - 1, idx + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        target = Math.max(0, idx - 1);
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = years.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    if (target !== idx) onChange(years[target]);
  };

  return (
    <div className="dial" role="radiogroup" aria-label="Pick a year" onKeyDown={onKeyDown}>
      <span className="dial__label" aria-hidden="true">
        Year
      </span>
      <div className="dial__track">
        {years.map((year) => {
          const active = year === value;
          return (
            <button
              key={year}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              className={`dial__year${active ? " is-active" : ""}`}
              onClick={() => onChange(year)}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );
}
