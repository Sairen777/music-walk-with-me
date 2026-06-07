import { useMemo, type KeyboardEvent } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import worldRaw from "world-atlas/countries-110m.json";
import "./worldmap.css";

const WIDTH = 980;
const HEIGHT = 495;

/** alpha-3 -> ISO 3166-1 numeric id used by world-atlas geometry. */
const NUMERIC_BY_ISO: Record<string, string> = { USA: "840" };

interface WorldMapProps {
  litIso: string;
  litLabel: string;
  onSelect: (iso: string) => void;
}

interface CountryPath {
  id: string;
  d: string;
}

export function WorldMap({ litIso, litLabel, onSelect }: WorldMapProps) {
  const litNumeric = NUMERIC_BY_ISO[litIso] ?? "";

  const { others, litShape, pin } = useMemo(() => {
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

    const others: CountryPath[] = [];
    let lit: Feature<Geometry, { name?: string }> | undefined;
    for (const f of collection.features) {
      if (String(f.id) === litNumeric) {
        lit = f;
        continue;
      }
      const d = toPath(f);
      if (d) others.push({ id: String(f.id), d });
    }

    const [cx, cy] = lit ? toPath.centroid(lit) : [WIDTH / 2, HEIGHT / 2];
    return {
      others,
      litShape: lit ? (toPath(lit) ?? "") : "",
      pin: { cx, cy },
    };
  }, [litNumeric]);

  const activate = (event: KeyboardEvent<SVGPathElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(litIso);
    }
  };

  return (
    <div className="map" data-on-field>
      <svg
        className="map__svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`World map. ${litLabel} is selectable.`}
      >
        <g className="map__others" aria-hidden="true">
          {others.map((c) => (
            <path key={c.id} d={c.d} className="map__country" />
          ))}
        </g>

        {litShape && (
          <g className="map__lit">
            <path className="map__lit-glow" d={litShape} aria-hidden="true" />
            <path
              className="map__lit-shape"
              d={litShape}
              role="button"
              tabIndex={0}
              aria-label={`Open ${litLabel}`}
              onClick={() => onSelect(litIso)}
              onKeyDown={activate}
            />
          </g>
        )}

        <g
          className="map__pin"
          transform={`translate(${pin.cx} ${pin.cy})`}
          aria-hidden="true"
        >
          <circle className="map__pin-pulse" r="7" />
          <circle className="map__pin-dot" r="4.5" />
        </g>
      </svg>

      <p className="map__hint" aria-hidden="true">
        <span className="map__hint-key">click</span> {litLabel}
      </p>
    </div>
  );
}
