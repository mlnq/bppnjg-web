import type { WeatherIcon } from "./weather";

const WEATHER_LABEL: Record<WeatherIcon, string> = {
  clearSky: "Bezchmurnie",
  mainlyClear: "Przeważnie słonecznie",
  partlyCloudy: "Częściowe zachmurzenie",
  overcast: "Pochmurno",
  fog: "Mgła",
  rimeFog: "Mgła osadzająca szadź",
  drizzleLight: "Słaba mżawka",
  drizzleModerate: "Umiarkowana mżawka",
  drizzleDense: "Intensywna mżawka",
  freezingDrizzleLight: "Słaba marznąca mżawka",
  freezingDrizzleDense: "Silna marznąca mżawka",
  rainLight: "Słaby deszcz",
  rainModerate: "Umiarkowany deszcz",
  rainHeavy: "Intensywny deszcz",
  freezingRainLight: "Słaby marznący deszcz",
  freezingRainHeavy: "Silny marznący deszcz",
  snowLight: "Słabe opady śniegu",
  snowModerate: "Umiarkowane opady śniegu",
  snowHeavy: "Intensywne opady śniegu",
  snowGrains: "Ziarnisty śnieg",
  rainShowersLight: "Słabe przelotne opady deszczu",
  rainShowersModerate: "Umiarkowane przelotne opady deszczu",
  rainShowersViolent: "Gwałtowne przelotne opady deszczu",
  snowShowersLight: "Słabe przelotne opady śniegu",
  snowShowersHeavy: "Silne przelotne opady śniegu",
  thunderstorm: "Burza",
  thunderstormLightHail: "Burza z lekkim gradem",
  thunderstormHeavyHail: "Burza z silnym gradem",
};

const WEATHER_ICON: Record<WeatherIcon, string> = {
  clearSky: "sun",
  mainlyClear: "cloud-sun",
  partlyCloudy: "cloud-sun",
  overcast: "cloud-sun",
  fog: "wind",
  rimeFog: "wind",
  drizzleLight: "droplet",
  drizzleModerate: "droplet",
  drizzleDense: "droplet",
  freezingDrizzleLight: "droplet",
  freezingDrizzleDense: "droplet",
  rainLight: "droplet",
  rainModerate: "droplet",
  rainHeavy: "droplet",
  freezingRainLight: "droplet",
  freezingRainHeavy: "droplet",
  snowLight: "cloud-sun",
  snowModerate: "cloud-sun",
  snowHeavy: "cloud-sun",
  snowGrains: "cloud-sun",
  rainShowersLight: "droplet",
  rainShowersModerate: "droplet",
  rainShowersViolent: "droplet",
  snowShowersLight: "cloud-sun",
  snowShowersHeavy: "cloud-sun",
  thunderstorm: "wind",
  thunderstormLightHail: "wind",
  thunderstormHeavyHail: "wind",
};

export function weatherLabel(icon: WeatherIcon): string {
  return WEATHER_LABEL[icon];
}

export function weatherIconName(icon: WeatherIcon): string {
  return WEATHER_ICON[icon];
}

export function weatherTone(icon: WeatherIcon): 'sun' | 'cloud' | 'rain' | 'storm' {
  if (icon === 'overcast' || icon === 'fog' || icon === 'rimeFog') return 'cloud';
  if (icon === 'thunderstorm' || icon === 'thunderstormLightHail' || icon === 'thunderstormHeavyHail') return 'storm';
  if (icon.includes('rain') || icon.includes('drizzle') || icon.includes('snow')) return 'rain';
  return 'sun';
}
