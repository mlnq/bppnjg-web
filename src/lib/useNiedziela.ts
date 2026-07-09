import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  clearPersistentCacheByPrefix,
  makeDailyCacheKey,
  usePersistentCache,
} from './usePersistentCache';

export type NiedzielaReading = {
  id: string;
  label: string;
  reference: string;
  title: string;
  introduction?: string;
  body: string;
};

export type NiedzielaDailyReadings = {
  date: string;
  season?: string;
  celebration?: string;
  sourceUrl: string;
  readings: NiedzielaReading[];
};

function formatDatePath(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const CACHE_PREFIX = 'pg.czytania.';

function decodeHtml(v: string) {
  return v
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-')
    .replace(/&hellip;/g, '...')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractReadingId(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseReadings(html: string, date: string): NiedzielaDailyReadings {
  const seasonM = html.match(/<p class="mb-0 lh-1 color-light">\s*([\s\S]*?)\s*<\/p>/i);
  const celebrationM = html.match(/<h1 class="mb-4 fs-2 color-light font-serif lh-sm">\s*<i>([\s\S]*?)<\/i>\s*<\/h1>/i);

  const pat = /<h2>(1\. czytanie|2\. czytanie|Psalm|Aklamacja|Ewangelia)\s*\(([\s\S]*?)\)<\/h2><h4><em>([\s\S]*?)<\/em><\/h4><p><strong>([\s\S]*?)<\/strong><\/p>([\s\S]*?)(?=<h2>|<\/div>\s*<\/div>)/gi;

  const readings: NiedzielaReading[] = [];
  const seen = new Set<string>();

  for (const m of html.matchAll(pat)) {
    const label = decodeHtml(m[1] ?? '');
    if (!label || seen.has(label)) continue;
    seen.add(label);
    readings.push({
      id: extractReadingId(label),
      label,
      reference: decodeHtml(m[2] ?? ''),
      title: decodeHtml(m[3] ?? ''),
      introduction: decodeHtml(m[4] ?? '') || undefined,
      body: decodeHtml(m[5] ?? ''),
    });
  }

  return {
    date,
    season: seasonM ? decodeHtml(seasonM[1]) : undefined,
    celebration: celebrationM ? decodeHtml(celebrationM[1]) : undefined,
    sourceUrl: `https://niezbednik.niedziela.pl/liturgia/${date}`,
    readings,
  };
}

async function fetchDailyReadings(): Promise<NiedzielaDailyReadings> {
  const date = formatDatePath(new Date());
  const r = await fetch(`/niedziela-proxy/liturgia/${date}`);
  if (!r.ok) throw new Error(`Nie można pobrać czytań (${r.status})`);
  const html = await r.text();
  return parseReadings(html, date);
}

export function useNiedziela() {
  const date = formatDatePath(new Date());
  const cacheKey = makeDailyCacheKey('czytania', date);
  const cache = usePersistentCache<NiedzielaDailyReadings>(cacheKey);

  useEffect(() => {
    clearPersistentCacheByPrefix(CACHE_PREFIX, (key) => key === cacheKey);
  }, [cacheKey]);

  const query = useQuery({
    queryKey: ['niedziela-readings', date],
    queryFn: async () => {
      const data = await fetchDailyReadings();
      cache.save(data);
      return data;
    },
    initialData: cache.data ?? undefined,
    initialDataUpdatedAt: cache.savedAt ? new Date(cache.savedAt).getTime() : undefined,
    enabled: !cache.hasValue,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
  });

  return {
    ...query,
    savedAt: cache.savedAt,
    isCachedForToday: cache.hasValue,
  };
}
