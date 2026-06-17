import { type CSSProperties, type JSX } from "react";
import { youtubeThumbnail, type YearInternetArtifact } from "../data/yearInternet";

interface InternetArtifactsPanelProps {
  items: readonly YearInternetArtifact[];
  year: number;
}

export function InternetArtifactsPanel({ items, year }: InternetArtifactsPanelProps): JSX.Element | null {
  if (items.length === 0) return null;

  return (
    <section className="capsule__artifacts capsule__internet" aria-label={`USA ${year} internet artifacts`}>
      <div className="capsule__artifacts-head">
        <h3 className="capsule__artifacts-title">Internet time capsule</h3>
        <p className="capsule__artifacts-sub">viral clips, Flash loops, web relics</p>
      </div>
      <div className="artifact-wall artifact-wall--internet">
        {items.map((item, index) => (
          <InternetCard key={`${item.yearStarted}-${item.title}`} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}

function kindLabel(kind: YearInternetArtifact["kind"]): string {
  const labels: Record<YearInternetArtifact["kind"], string> = {
    meme: "Meme",
    flash: "Flash",
    site: "Web relic",
    "viral-video": "Viral clip",
    place: "Place",
  };
  return labels[kind];
}

interface InternetCardProps {
  item: YearInternetArtifact;
  index: number;
}

function InternetCard({ item, index }: InternetCardProps) {
  return (
    <a
      href={item.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="artifact-wall__tile artifact-wall__tile--internet artifact-wall__card internet-card"
      style={{ "--i": index } as CSSProperties}
      aria-label={`Open ${item.title} ${kindLabel(item.kind)}`}
    >
      {item.youtubeId && (
        <img
          className="artifact-wall__image internet-card__thumb"
          src={youtubeThumbnail(item.youtubeId)}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      )}
      <div className="artifact-wall__scrim internet-card__body">
        <span className="internet-card__kind">{kindLabel(item.kind)}</span>
        <span className="artifact-wall__title internet-card__title">{item.title}</span>
        <span className="artifact-wall__meta internet-card__desc">{item.description}</span>
        <span className="artifact-wall__meta internet-card__meta">
          {item.yearStarted} · {item.sourceLabel ?? "source"}
        </span>
        <span className="artifact-wall__chip">{item.youtubeId ? "Watch" : "Open"}</span>
      </div>
    </a>
  );
}
