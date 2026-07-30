import { useEffect, useState } from 'react';
import type { ApiStop } from '../data/types';
import { getDailyWeatherForecast, type DailyWeatherForecast } from './weather';

export type StopWeather = { temperatureC: number; icon: DailyWeatherForecast['hours'][number]['icon'] };

function stopHour(stop: ApiStop): number | null {
  const match = /^(\d{1,2}):\d{2}$/.exec(stop.scheduledAt ?? stop.time);
  if (!match) return null;
  const hour = Number(match[1]);
  return hour >= 6 && hour <= 23 ? hour : null;
}

/** Prognoza dla godzin i miejscowości widocznych w planie aktualnego dnia. */
export function usePlanWeather(stops: ApiStop[]): Record<string, StopWeather> {
  const [weather, setWeather] = useState<Record<string, StopWeather>>({});
  const key = stops.map((stop) => `${stop.id}:${stop.townName}:${stop.time}`).join('|');

  useEffect(() => {
    const controller = new AbortController();
    const uniqueStops = Array.from(new Map(
      stops.filter((stop) => stop.townName && stopHour(stop) !== null)
        .map((stop) => [stop.townName!, stop]),
    ).values());

    Promise.all(uniqueStops.map(async (stop) => {
      const forecast = await getDailyWeatherForecast(stop.townName!, stop, controller.signal);
      return [stop.townName!, forecast] as const;
    }))
      .then((forecasts) => {
        if (controller.signal.aborted) return;
        const byTown = new Map(forecasts);
        const result: Record<string, StopWeather> = {};
        for (const stop of stops) {
          const hour = stopHour(stop);
          const forecast = stop.townName ? byTown.get(stop.townName) : null;
          const atHour = hour !== null ? forecast?.hours.find((item) => item.hour === hour) : null;
          if (atHour) result[stop.id] = { temperatureC: atHour.temperatureC, icon: atHour.icon };
        }
        setWeather(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setWeather({});
      });

    return () => controller.abort();
  }, [key]);

  return weather;
}
