import { Icon } from '../../lib/icons';
import { Eyebrow } from '../../components';
import type { ApiPilgrimageDay } from '../../data/types';

const WEATHER_ICON: Record<string, string> = {
  sunny: 'sun', partlyCloudy: 'cloud-sun', cloudy: 'cloud-sun',
  rain: 'droplet', storm: 'wind',
};

type Props = { day: ApiPilgrimageDay };

export function WeatherWidget({ day }: Props) {
  const w = day.weather;
  const town = day.stops[day.stops.length - 1]?.townName ?? '';
  if (!w) return null;
  return (
    <div className="widget enter enter-2">
      <div className="widget__h">
        <Eyebrow>Pogoda na trasie</Eyebrow>
        <span className="localnote"><Icon name="map-pin" />{town}</span>
      </div>
      <div className="weather">
        <Icon name={WEATHER_ICON[w.icon] ?? 'cloud-sun'} className="weather__ic" />
        <div className="grow">
          <div className="weather__temp">{w.temperatureC}°</div>
          <div className="weather__desc">
            {{ sunny: 'Słonecznie', partlyCloudy: 'Częściowe zachmurzenie', cloudy: 'Pochmurno', rain: 'Deszcz', storm: 'Burze w okolicy' }[w.icon] ?? ''}
          </div>
        </div>
      </div>
    </div>
  );
}
