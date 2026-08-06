import { Icon } from "../../lib/icons";
import { fmt } from "../../lib/format";
import { scheduledStopTime } from "../../data/api";
import type { ApiStop } from "../../data/types";
import type { StopWeather } from "../../lib/usePlanWeather";
import {
  weatherIconName,
  weatherLabel,
  weatherTone,
} from "../../lib/weatherPresentation";

const STOP_ICON: Record<string, string> = {
  start: "flag",
  night: "bed",
};

function badgeIcon(badge?: string | null): string {
  if (badge === "Modlitwa") return "cross";
  if (badge === "Postój") return "coffee";
  if (badge === "Konferencja") return "book";
  return "map-pin";
}

type ItemProps = {
  stop: ApiStop;
  state: "done" | "now" | "next";
  resting?: boolean;
  plannedDepartureTime?: string;
  traveling?: boolean;
  distToNext?: number;
  weather?: StopWeather;
};

export function TimelineItem({
  stop,
  state: s,
  resting = false,
  traveling = false,
  distToNext,
  weather,
}: ItemProps) {
  const cls = [
    s === "now" ? "is-now" : s === "done" ? "is-done" : "",
    resting ? "is-resting" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const icon = STOP_ICON[stop.type] ?? badgeIcon(stop.badge);
  return (
    <div className={"tl__item " + cls}>
      <span className="tl__node">
        <i />
      </span>
      <div className="tl__stop">
        <div className="tl__head">
          <div className="tl__time">
            <Icon name={icon} />
            {scheduledStopTime(stop)}
            {resting && (
              <span className="badge badge--now tl__badge">Aktualnie</span>
            )}
          </div>
          <div className="tl__meta">
            {(stop.durationMin || resting) && (
              <div className="tl__badges">
                {stop.durationMin ? (
                  <span className="badge tl__badge">
                    <Icon name="timer" />
                    {stop.durationMin} min
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <div className="tl__weather-row">
          <div className="tl__place">{stop.townName ?? stop.name}</div>
          {weather && (
            <div
              className={`tl__forecast tl__forecast--${weatherTone(weather.icon)}`}
              aria-label={`Pogoda o ${scheduledStopTime(stop)} w ${stop.townName ?? stop.name}: ${weatherLabel(weather.icon)}`}
            >
              <Icon name={weatherIconName(weather.icon)} />
              <span>
                <b>{weather.temperatureC}°</b>
              </span>
            </div>
          )}
        </div>
        {stop.description && <div className="tl__desc">{stop.description}</div>}
      </div>
      {distToNext != null && distToNext > 0 && (
        <div
          className={`tl__seg${traveling && !resting ? " is-traveling" : ""}`}
        >
          <Icon name="footprints" />
          {fmt(distToNext)} km
          {traveling && !resting && (
            <span className="tl__traveler">
              <Icon name="user" />W trasie
            </span>
          )}
        </div>
      )}
    </div>
  );
}
