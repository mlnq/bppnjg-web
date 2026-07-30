/** Szczegółowe warunki odpowiadające kodom WMO zwracanym przez Open-Meteo. */
export type WeatherIcon =
  | 'clearSky' | 'mainlyClear' | 'partlyCloudy' | 'overcast'
  | 'fog' | 'rimeFog'
  | 'drizzleLight' | 'drizzleModerate' | 'drizzleDense'
  | 'freezingDrizzleLight' | 'freezingDrizzleDense'
  | 'rainLight' | 'rainModerate' | 'rainHeavy'
  | 'freezingRainLight' | 'freezingRainHeavy'
  | 'snowLight' | 'snowModerate' | 'snowHeavy' | 'snowGrains'
  | 'rainShowersLight' | 'rainShowersModerate' | 'rainShowersViolent'
  | 'snowShowersLight' | 'snowShowersHeavy'
  | 'thunderstorm' | 'thunderstormLightHail' | 'thunderstormHeavyHail';

export type DailyWeatherForecast = {
  hours: Array<{ hour: number; temperatureC: number; icon: WeatherIcon }>;
};

type CachedForecast = {
  date: string;
  forecast: DailyWeatherForecast;
};

type OpenMeteoForecast = {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
  };
};

type OpenMeteoGeocoding = {
  results?: Array<{ latitude: number; longitude: number }>;
};

const CACHE_PREFIX = 'pg.weather.v2.';
const inFlight = new Map<string, Promise<DailyWeatherForecast | null>>();

function localDate(date = new Date()): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function weatherIcon(code: number): WeatherIcon {
  const codes: Record<number, WeatherIcon> = {
    0: 'clearSky', 1: 'mainlyClear', 2: 'partlyCloudy', 3: 'overcast',
    45: 'fog', 48: 'rimeFog',
    51: 'drizzleLight', 53: 'drizzleModerate', 55: 'drizzleDense',
    56: 'freezingDrizzleLight', 57: 'freezingDrizzleDense',
    61: 'rainLight', 63: 'rainModerate', 65: 'rainHeavy',
    66: 'freezingRainLight', 67: 'freezingRainHeavy',
    71: 'snowLight', 73: 'snowModerate', 75: 'snowHeavy', 77: 'snowGrains',
    80: 'rainShowersLight', 81: 'rainShowersModerate', 82: 'rainShowersViolent',
    85: 'snowShowersLight', 86: 'snowShowersHeavy',
    95: 'thunderstorm', 96: 'thunderstormLightHail', 99: 'thunderstormHeavyHail',
  };
  return codes[code] ?? 'overcast';
}

async function coordinates(town: string, signal?: AbortSignal): Promise<{ latitude: number; longitude: number } | null> {
  const query = new URLSearchParams({ name: town, count: '1', language: 'pl', countryCode: 'PL' });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${query}`, { signal });
  if (!response.ok) throw new Error(`Geocoding ${response.status}`);
  const data = await response.json() as OpenMeteoGeocoding;
  return data.results?.[0] ?? null;
}

/**
 * Pobiera prognozę godzinową na dzisiejsze 06:00–24:00. Wynik dla lokalizacji
 * zapisuje lokalnie do końca dnia, więc nie odpyta usługi ponownie.
 */
async function loadDailyWeatherForecast(
  town: string,
  position: { latitude: number | null; longitude: number | null },
  signal?: AbortSignal,
): Promise<DailyWeatherForecast | null> {
  const date = localDate();
  const cacheKey = `${CACHE_PREFIX}${date}.${town.toLocaleLowerCase('pl')}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as CachedForecast;
      if (parsed.date === date && Array.isArray(parsed.forecast?.hours)) return parsed.forecast;
      // Format cache'u mógł pochodzić ze starszej wersji widżetu.
      localStorage.removeItem(cacheKey);
    }
  } catch {
    // Brak localStorage (np. tryb prywatny) nie blokuje prognozy.
  }

  const resolved = position.latitude !== null && position.longitude !== null
    ? position
    : await coordinates(town, signal);
  if (!resolved) return null;

  const query = new URLSearchParams({
    latitude: String(resolved.latitude),
    longitude: String(resolved.longitude),
    hourly: 'temperature_2m,weather_code',
    timezone: 'auto',
    forecast_days: '1',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, { signal });
  if (!response.ok) throw new Error(`Weather ${response.status}`);
  const data = await response.json() as OpenMeteoForecast;
  const hours = Array.from({ length: 18 }, (_, hour) => hour + 6)
    .map((hour) => {
      const at = `${date}T${String(hour).padStart(2, '0')}:00`;
      const index = data.hourly?.time?.indexOf(at) ?? -1;
      const temperature = index >= 0 ? data.hourly?.temperature_2m?.[index] : undefined;
      const code = index >= 0 ? data.hourly?.weather_code?.[index] : undefined;
      return temperature === undefined || code === undefined
        ? null
        : { hour, temperatureC: Math.round(temperature), icon: weatherIcon(code) };
    })
    .filter((item): item is { hour: number; temperatureC: number; icon: WeatherIcon } => item !== null);
  if (hours.length === 0) return null;

  const forecast = { hours };
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ date, forecast } satisfies CachedForecast));
  } catch {
    // Nie uniemożliwiamy działania, jeśli cache jest niedostępny.
  }
  return forecast;
}

export function getDailyWeatherForecast(
  town: string,
  position: { latitude: number | null; longitude: number | null },
  signal?: AbortSignal,
): Promise<DailyWeatherForecast | null> {
  const key = `${CACHE_PREFIX}${localDate()}.${town.toLocaleLowerCase('pl')}`;
  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = loadDailyWeatherForecast(town, position, signal);
  inFlight.set(key, request);
  void request.then(
    () => inFlight.delete(key),
    () => inFlight.delete(key),
  );
  return request;
}
