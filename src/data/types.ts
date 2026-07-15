export type ApiStop = {
  id: string;
  orderIndex: number;
  name: string | null;
  townName: string | null;
  time: string;
  type: 'start' | 'info' | 'night';
  distanceToNextKm: number;
  durationMin?: number | null;
  latitude: number | null;
  longitude: number | null;
  description?: string | null;
  badge?: string | null;
};

export type ApiPilgrimageDay = {
  id: string;
  dayNumber: number;
  title: string;
  date: string;
  route: {
    startStopId: string;
    endStopId: string;
    totalDistanceKm: number;
    scheduledStartTime: string;
    plannedArrivalTime: string;
  };
  stops: ApiStop[];
  reflection?: { title: string };
  conference?: {
    id?: number;
    date?: string;
    author?: string;
    title: string;
    content: string;
  };
  weather?: {
    temperatureC: number;
    icon: 'sunny' | 'cloudy' | 'rain' | 'storm' | 'partlyCloudy';
  };
  news: NewsItem[];
};

export type ApiPilgrimage = {
  id: string;
  name: string;
  startDate: string;
  totalDays: number;
  totalDistanceKm?: number;
  overall?: {
    traveledDistanceKm: number;
    remainingDistanceKm: number;
    totalDistanceKm: number;
    progressPercent: number;
    completedDayCount: number;
    activeDayNumber: number;
  };
  days: ApiPilgrimageDay[];
};

export type BootstrapResponse = {
  pilgrimage: ApiPilgrimage | null;
};

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  category: 'announcement' | 'logistics' | 'spiritual' | 'weather';
  publishedAt: string;
  isPinned?: boolean;
};

export type BackendNewsItem = {
  id: string;
  title: string;
  summary: string;
  content?: string;
  category: string;
  publishedAt: string;
  isPinned?: boolean;
};

export type NewsResponse = { items?: BackendNewsItem[] };

export type QuartermasterComment = {
  id: string;
  dayNumber?: number;
  title: string;
  content: string;
  publishedAt: string;
};

export type QuartermasterResponse = { items?: QuartermasterComment[] };

export type CurrentRouteStateDto = {
  source: 'gps' | 'time-estimated';
  currentTownId: string;
  traveledDistanceKm: number;
  remainingDistanceKm: number;
  statusLabel: string;
  computedAt: string;
};

export type RouteStateRequest = {
  pilgrimageId: string;
  dayId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
};

export type Akapit =
  | { typ: 'lead' | 'p' | 'h3' | 'verse' | 'resp' | 'drop' | 'source'; t: string };

export type ContentModule = {
  modul: string;
  kolor: 'rose' | 'amber' | 'green' | 'blue';
  ic: string;
  tytul: string;
  sub: string;
  akapity: Akapit[];
};

export type Konferencja = {
  id: string;
  tytul: string;
  autor: string;
  mp3Url: string;
  srtUrl: string;
  akapity?: Akapit[];
};

export type KonferencjaListItem = Pick<Konferencja, 'id' | 'tytul' | 'autor'>;
