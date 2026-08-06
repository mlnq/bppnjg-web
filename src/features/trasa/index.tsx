import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePilgrimage } from "../../app/PilgrimageContext";
import { toDzien, buildKmCumulative, scheduledStopTime } from "../../data/api";
import { usePozycja } from "../../lib/usePozycja";
import type { ApiPilgrimage, ApiPilgrimageDay } from "../../data/types";
import { fmt } from "../../lib/format";
import { Icon } from "../../lib/icons";
import {
  Pill,
  Progress,
  SectionHead,
  Button,
  Eyebrow,
  Loader,
  DailyDistanceHero,
} from "../../components";
import { TimelineItem } from "./TimelineItem";
import { usePlanWeather } from "../../lib/usePlanWeather";

// API uses 0 for stops whose duration has not yet been configured. Keep such
// a stop current briefly instead of switching its status to "W trasie" at the
// exact planned arrival minute.
const DEFAULT_STOP_WINDOW_MIN = 30;

function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : null;
}

function stopWindowDuration(stop: ApiPilgrimageDay["stops"][number]): number {
  return Math.max(stop.durationMin ?? 0, DEFAULT_STOP_WINDOW_MIN);
}

function isTravelingBetweenStops(
  stops: ApiPilgrimageDay["stops"],
  index: number,
  now = new Date(),
): boolean {
  const stop = stops[index];
  const nextStop = stops[index + 1];
  if (!stop || !nextStop) return false;

  const start = timeToMinutes(scheduledStopTime(stop));
  const next = timeToMinutes(scheduledStopTime(nextStop));
  if (start === null || next === null) return false;

  const departure = Math.min(start + stopWindowDuration(stop), next);
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= departure && current < next;
}

function isRestingAtStop(
  stops: ApiPilgrimageDay["stops"],
  index: number,
  now = new Date(),
): boolean {
  const stop = stops[index];
  const nextStop = stops[index + 1];
  if (!stop || !nextStop) return false;

  const start = timeToMinutes(scheduledStopTime(stop));
  const next = timeToMinutes(scheduledStopTime(nextStop));
  if (start === null || next === null) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  const duration = stopWindowDuration(stop);
  return current >= start && current < Math.min(start + duration, next);
}

function scheduleStopState(
  stops: ApiPilgrimageDay["stops"],
  index: number,
  now = new Date(),
): "done" | "now" | "next" {
  const stop = stops[index];
  if (!stop) return "next";

  const start = timeToMinutes(scheduledStopTime(stop));
  const nextStop = stops[index + 1];
  const next = nextStop ? timeToMinutes(scheduledStopTime(nextStop)) : null;
  if (start === null) return "next";

  const current = now.getHours() * 60 + now.getMinutes();
  // The final waypoint remains the current destination after its arrival.
  if (next === null) return current >= start ? "now" : "next";

  const departure = Math.min(start + stopWindowDuration(stop), next);
  if (current >= departure) return "done";
  return current >= start ? "now" : "next";
}

function plannedDepartureTime(
  stops: ApiPilgrimageDay["stops"],
  index: number,
): string | undefined {
  const stop = stops[index];
  const nextStop = stops[index + 1];
  if (!stop || !nextStop) return undefined;

  const start = timeToMinutes(scheduledStopTime(stop));
  const next = timeToMinutes(scheduledStopTime(nextStop));
  if (start === null || next === null) return undefined;

  const end = Math.min(start + stopWindowDuration(stop), next);
  return `${String(Math.floor(end / 60) % 24).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}

export function TrasaScreen() {
  const { state, settings } = usePilgrimage();
  if (state.status === "loading") return <Loader fullscreen />;
  if (state.status !== "ok")
    return (
      <p className="muted" style={{ padding: 32 }}>
        {state.message}
      </p>
    );
  return (
    <TrasaLoaded
      pilgrimage={state.pilgrimage}
      activeDay={state.day}
      tryb={settings.tryb}
    />
  );
}

function TrasaLoaded({
  pilgrimage,
  activeDay,
  tryb,
}: {
  pilgrimage: ApiPilgrimage;
  activeDay: ApiPilgrimageDay;
  tryb: "auto" | "gps" | "plan";
}) {
  const navigate = useNavigate();
  const activeIdx = pilgrimage.days.findIndex(
    (d) => d.dayNumber === activeDay.dayNumber,
  );
  const [idx, setIdx] = useState(activeIdx >= 0 ? activeIdx : 0);
  const day = pilgrimage.days[idx];
  const dzien = toDzien(day);
  const pos = usePozycja(dzien, tryb);
  const kmCum = buildKmCumulative(day.stops);
  const weather = usePlanWeather(day.stops);
  const gpsActive = pos.zrodlo === "gps";
  const etapZakonczony = pos.doCelu < 0.005;

  function stopState(stopKm: number): "done" | "now" | "next" {
    // All stops of already completed stages should retain their completed
    // appearance when the user goes back to review an earlier day.
    if (idx < activeIdx) return "done";
    if (idx > activeIdx) return "next";
    if (stopKm <= pos.km - 0.5) return "done";
    if (stopKm <= pos.km + 2) return "now";
    return "next";
  }

  const hasSchedule = day.stops.length > 1;

  return (
    <div className="viewport scroll">
      <div className="stage">
        <div className="dayswitch enter enter-1">
          <button
            className="iconbtn"
            disabled={idx === 0}
            style={{ opacity: idx === 0 ? 0.35 : 1 }}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            aria-label="Poprzedni dzień"
          >
            <Icon name="chevron-left" />
          </button>
          <div className="center">
            <div className="dayswitch__label">
              Dzień {day.dayNumber} z {pilgrimage.totalDays}
            </div>
            <div className="dayswitch__sub">
              {dzien.od} → {dzien.do}
            </div>
          </div>
          <button
            className="iconbtn"
            disabled={idx === pilgrimage.days.length - 1}
            style={{ opacity: idx === pilgrimage.days.length - 1 ? 0.35 : 1 }}
            onClick={() =>
              setIdx((i) => Math.min(pilgrimage.days.length - 1, i + 1))
            }
            aria-label="Następny dzień"
          >
            <Icon name="chevron-right" />
          </button>
        </div>

        {hasSchedule ? (
          <>
            {pos.zrodlo === "plan" && (
              <div
                className="alert alert--info enter enter-2"
                style={{ marginTop: "var(--s4)" }}
              >
                <Icon name="locate" className="alert__ic" />
                <span className="alert__txt">
                  GPS wyłączony — pozycja według harmonogramu
                </span>
              </div>
            )}
            <div
              className="card enter enter-2"
              style={{ padding: "var(--s5)", marginTop: "var(--s4)" }}
            >
              <div className="between">
                <Pill variant="rose">
                  Etap {day.dayNumber} z {pilgrimage.totalDays}
                </Pill>
              </div>
              {idx === activeIdx ? (
                <DailyDistanceHero distance={dzien.dystans} marginTop="var(--s4)" />
              ) : (
                <>
                  <div
                    className="dial__num"
                    style={{ marginTop: "var(--s4)", color: "var(--ink-2)" }}
                  >
                    {fmt(kmCum[kmCum.length - 1] || day.route.totalDistanceKm)}
                    <small style={{ color: "var(--muted)" }}>km</small>
                  </div>
                  <Eyebrow>długość etapu</Eyebrow>
                </>
              )}
              <div className="dial__route mt3">
                {dzien.od}
                <span className="arrow">→</span>
                {dzien.do}
              </div>
              {idx === activeIdx && (
                <div className="mt4">
                  <Progress
                    pct={pos.pct}
                    leftLabel={
                      gpsActive
                        ? fmt(pos.km) + " km przebyto"
                        : "Postęp: " + pos.pct + "%"
                    }
                    rightLabel={
                      etapZakonczony
                        ? "Etap zakończony - odpoczynek"
                        : "Do końca dzisiejszego etapu: " +
                          fmt(pos.doCelu) +
                          " km"
                    }
                  />
                </div>
              )}
            </div>

            <SectionHead>Plan dnia</SectionHead>
            <div
              className="card enter enter-3"
              style={{ padding: "var(--s5) var(--s5) var(--s4)" }}
            >
              <div className="tl">
                <div className="tl__line" />
                {day.stops.map((stop, i) => {
                  // A planned break is a more precise signal than a distance
                  // estimate (especially when the GPS fix is slightly off).
                  // Keep its stop visibly selected even when GPS is available.
                  const resting =
                    idx === activeIdx && isRestingAtStop(day.stops, i);

                  return (
                    <TimelineItem
                      key={stop.id}
                      stop={stop}
                      state={
                        resting
                          ? "now"
                          : pos.zrodlo === "plan"
                            ? scheduleStopState(day.stops, i)
                            : stopState(kmCum[i])
                      }
                      resting={resting}
                      plannedDepartureTime={
                        idx === activeIdx &&
                        pos.zrodlo === "plan" &&
                        stopWindowDuration(stop) > 0
                          ? plannedDepartureTime(day.stops, i)
                          : undefined
                      }
                      traveling={
                        idx === activeIdx &&
                        pos.zrodlo === "plan" &&
                        isTravelingBetweenStops(day.stops, i)
                      }
                      distToNext={
                        stop.distanceToNextKm > 0
                          ? stop.distanceToNextKm
                          : undefined
                      }
                      weather={weather[stop.id]}
                    />
                  );
                })}
              </div>
            </div>
            <div className="center mt5">
              <Button
                variant="ghost"
                icon="book"
                onClick={() => navigate("/konferencja/" + day.dayNumber)}
              >
                Konferencja dnia
              </Button>
            </div>
          </>
        ) : (
          <div
            className="card enter enter-2"
            style={{ padding: "var(--s8) var(--s5)", marginTop: "var(--s4)" }}
          >
            <div className="empty">
              <Icon name="calendar" className="empty__ic" />
              <div className="empty__t">
                Harmonogram dnia {day.dayNumber} pojawi się przed etapem
              </div>
              <p className="muted mt2" style={{ fontSize: 14 }}>
                {dzien.od} → {dzien.do} · {fmt(day.route.totalDistanceKm)} km
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
