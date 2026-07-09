import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function decodeHtml(value: string) {
  return value
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
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseReadingsFromHtml(html: string, date: string): NiedzielaDailyReadings {
  const seasonMatch = html.match(/<p class="mb-0 lh-1 color-light">\s*([\s\S]*?)\s*<\/p>/i);
  const celebrationMatch = html.match(
    /<h1 class="mb-4 fs-2 color-light font-serif lh-sm">\s*<i>([\s\S]*?)<\/i>\s*<\/h1>/i
  );

  const readingPattern =
    /<h2>(1\. czytanie|2\. czytanie|Psalm|Aklamacja|Ewangelia)\s*\(([\s\S]*?)\)<\/h2><h4><em>([\s\S]*?)<\/em><\/h4><p><strong>([\s\S]*?)<\/strong><\/p>([\s\S]*?)(?=<h2>|<\/div>\s*<\/div>)/gi;

  const readings: NiedzielaReading[] = [];
  const seenLabels = new Set<string>();

  for (const match of html.matchAll(readingPattern)) {
    const label = decodeHtml(match[1] ?? '');

    if (!label || seenLabels.has(label)) {
      continue;
    }

    seenLabels.add(label);

    const reference = decodeHtml(match[2] ?? '');
    const title = decodeHtml(match[3] ?? '');
    const introduction = decodeHtml(match[4] ?? '');
    const body = decodeHtml(match[5] ?? '');

    readings.push({
      id: extractReadingId(label),
      label,
      reference,
      title,
      introduction: introduction || undefined,
      body,
    });
  }

  return {
    date,
    season: seasonMatch ? decodeHtml(seasonMatch[1]) : undefined,
    celebration: celebrationMatch ? decodeHtml(celebrationMatch[1]) : undefined,
    sourceUrl: `https://niezbednik.niedziela.pl/liturgia/${date}`,
    readings,
  };
}

export const niedzielaApi = createApi({
  reducerPath: 'niedzielaApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://niezbednik.niedziela.pl',
    responseHandler: 'text',
  }),
  endpoints: (builder) => ({
    getDailyReadings: builder.query<NiedzielaDailyReadings, void>({
      query: () => {
        const date = formatDatePath(new Date());

        return {
          url: `/liturgia/${date}`,
          responseHandler: 'text',
        };
      },
      transformResponse: (response) => {
        const date = formatDatePath(new Date());

        return parseReadingsFromHtml(String(response), date);
      },
    }),
  }),
});

export const { useGetDailyReadingsQuery } = niedzielaApi;
