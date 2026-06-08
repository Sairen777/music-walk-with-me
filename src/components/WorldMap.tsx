import { useMemo, type CSSProperties, type KeyboardEvent } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import worldRaw from "world-atlas/countries-110m.json";
import "./worldmap.css";

const WIDTH = 980;
const HEIGHT = 495;

/** alpha-3 -> ISO 3166-1 numeric id used by world-atlas geometry. */
const NUMERIC_BY_ISO: Record<string, string> = { USA: "840", RUS: "643" };

export interface MapCountry {
  iso: string;
  label: string;
}

interface WorldMapProps {
  countries: MapCountry[];
  onSelect: (iso: string) => void;
}

interface CountryPath {
  id: string;
  d: string;
}

interface LitCountry extends MapCountry {
  d: string;
  cx: number;
  cy: number;
}

export function WorldMap({ countries, onSelect }: WorldMapProps) {
  const { others, lit } = useMemo(() => {
    const collection = feature(
      worldRaw as unknown as Parameters<typeof feature>[0],
      (worldRaw as { objects: { countries: unknown } }).objects
        .countries as Parameters<typeof feature>[1],
    ) as unknown as FeatureCollection<Geometry, { name?: string }>;

    const projection = geoNaturalEarth1().fitExtent(
      [
        [12, 10],
        [WIDTH - 12, HEIGHT - 10],
      ],
      collection,
    );
    const toPath = geoPath(projection);

    const activeByNumeric = new Map<string, MapCountry>();
    for (const c of countries) {
      const numeric = NUMERIC_BY_ISO[c.iso];
      if (numeric) activeByNumeric.set(numeric, c);
    }

    const others: CountryPath[] = [];
    const lit: LitCountry[] = [];
    for (const f of collection.features) {
      const id = String(f.id);
      const d = toPath(f);
      if (!d) continue;
      const active = activeByNumeric.get(id);
      if (active) {
        const [cx, cy] = toPath.centroid(f);
        lit.push({ ...active, d, cx, cy });
      } else {
        others.push({ id, d });
      }
    }
    return { others, lit };
  }, [countries]);

  const activate = (event: KeyboardEvent<SVGPathElement>, iso: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(iso);
    }
  };

  const names = lit.map((c) => c.label).join(" and ");

  return (
    <div className="map">
      <svg
        className="map__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`World map. ${names || "No countries"} selectable.`}
      >
        <g className="map__others" aria-hidden="true">
          {others.map((c) => (
            <path key={c.id} d={c.d} className="map__country" />
          ))}
        </g>

        {lit.map((c, i) => (
          <g
            key={c.iso}
            className="map__lit"
            style={{ "--lit": `var(--candy-${(i % 5) + 1})` } as CSSProperties}
          >
            <path className="map__lit-glow" d={c.d} aria-hidden="true" />
            <path
              className="map__lit-shape"
              d={c.d}
              role="button"
              tabIndex={0}
              aria-label={`Open ${c.label}`}
              onClick={() => onSelect(c.iso)}
              onKeyDown={(event) => activate(event, c.iso)}
            />
            <g
              className="map__pin"
              transform={`translate(${c.cx} ${c.cy})`}
              aria-hidden="true"
            >
              <circle className="map__pin-pulse" r="7" />
              <circle className="map__pin-dot" r="4.5" />
            </g>
            <text
              className="map__label"
              x={c.cx}
              y={c.cy - 14}
              textAnchor="middle"
              aria-hidden="true"
            >
              {c.label}
            </text>
          </g>
        ))}
      </svg>

      <p className="map__hint" aria-hidden="true">
        <span className="map__hint-key">click</span> a glowing country
      </p>
    </div>
  );
}
