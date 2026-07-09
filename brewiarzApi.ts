import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export type BreviaryOfficeId =
  | 'godzina-czytan'
  | 'jutrznia'
  | 'modlitwa-przedpoludniowa'
  | 'modlitwa-poludniowa'
  | 'modlitwa-popoludniowa'
  | 'nieszpory'
  | 'kompleta';

export type BreviarySection = {
  id: string;
  title: string;
  body: string;
  variants?: BreviarySectionVariant[];
};

export type BreviarySectionVariant = {
  id: string;
  label: string;
  body: string;
};

export type BreviaryOffice = {
  date: string;
  liturgicalDay?: string;
  psalterWeek?: string;
  season?: string;
  office: BreviaryOfficeId;
  officeLabel: string;
  sourceUrl: string;
  sections: BreviarySection[];
};

const OFFICE_CONFIG: Record<BreviaryOfficeId, { fileName: string; label: string }> = {
  'godzina-czytan': { fileName: 'godzczyt.php3', label: 'Godzina czytan' },
  jutrznia: { fileName: 'jutrznia.php3', label: 'Jutrznia' },
  'modlitwa-przedpoludniowa': { fileName: 'modlitwa1.php3', label: 'Modlitwa przedpoludniowa' },
  'modlitwa-poludniowa': { fileName: 'modlitwa2.php3', label: 'Modlitwa poludniowa' },
  'modlitwa-popoludniowa': { fileName: 'modlitwa3.php3', label: 'Modlitwa popoludniowa' },
  nieszpory: { fileName: 'nieszpory.php3', label: 'Nieszpory' },
  kompleta: { fileName: 'kompleta.php3', label: 'Kompleta' },
};

const SECTION_TITLES = [
  'HYMN',
  'PSALMODIA',
  'CZYTANIE',
  'RESPONSORIUM KRÓTKIE',
  'RESPONSORIUM',
  'PIEŚŃ ZACHARIASZA',
  'PIEŚŃ MARYI',
  'PROŚBY',
  'MODLITWA',
] as const;

function decodeLatin1(bytes: Uint8Array) {
  let result = '';

  for (const byte of bytes) {
    result += String.fromCharCode(byte);
  }

  return result;
}

function latin1ToLatin2(value: string) {
  return value
    .replace(/\u00b1/g, 'ą')
    .replace(/\u00e6/g, 'ć')
    .replace(/\u00ea/g, 'ę')
    .replace(/\u00b3/g, 'ł')
    .replace(/\u00f1/g, 'ń')
    .replace(/\u00b6/g, 'ś')
    .replace(/\u00bf/g, 'ż')
    .replace(/\u00bc/g, 'ź')
    .replace(/\u00a1/g, 'Ą')
    .replace(/\u00c6/g, 'Ć')
    .replace(/\u00ca/g, 'Ę')
    .replace(/\u00a3/g, 'Ł')
    .replace(/\u00d1/g, 'Ń')
    .replace(/\u00a6/g, 'Ś')
    .replace(/\u00af/g, 'Ż')
    .replace(/\u00ac/g, 'Ź');
}

function getMonthDirectory(monthIndex: number) {
  return ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][monthIndex];
}

function getBaseDayToken(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');

  return `${day}${month}`;
}

function getMonthPrefix(date: Date) {
  const year = String(date.getFullYear()).slice(-2);
  return `/${getMonthDirectory(date.getMonth())}_${year}`;
}

function getDayDirectoryCandidates(date: Date) {
  const dayToken = getBaseDayToken(date);

  return [
    `${dayToken}`,
    `${dayToken}p`,
    `${dayToken}w1`,
    `${dayToken}w2`,
    `${dayToken}w3`,
    `${dayToken}w4`,
  ];
}

function getOfficeUrlCandidates(date: Date, office: BreviaryOfficeId) {
  const monthPrefix = getMonthPrefix(date);
  const fileName = OFFICE_CONFIG[office].fileName;

  return getDayDirectoryCandidates(date).map((directory) => `${monthPrefix}/${directory}/${fileName}`);
}

function getIndexUrlCandidates(date: Date) {
  const monthPrefix = getMonthPrefix(date);

  return getDayDirectoryCandidates(date).map((directory) => `${monthPrefix}/${directory}/index.php3?l=i`);
}

function extractOfficeUrlFromIndex(indexHtml: string, office: BreviaryOfficeId, date: Date) {
  const fileName = OFFICE_CONFIG[office].fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const monthPrefix = getMonthPrefix(date).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const absoluteMatch = indexHtml.match(new RegExp(`href="(${monthPrefix}\\/[^"]*\\/${fileName})"`, 'i'));

  if (absoluteMatch?.[1]) {
    return absoluteMatch[1];
  }

  const relativeMatch = indexHtml.match(new RegExp(`href="([^"]*${fileName})"`, 'i'));

  if (!relativeMatch?.[1]) {
    return null;
  }

  const relativeHref = relativeMatch[1];

  if (relativeHref.startsWith('/')) {
    return relativeHref;
  }

  return null;
}

function hasBreviaryContent(html: string) {
  return (
    html.includes('wejrzyj ku wspomo') ||
    html.includes('<font color=red><b>HYMN</b></font>') ||
    html.includes('Wydawnictwo Pallottinum')
  );
}

function convertPageLikePkar70(html: string) {
  let page = latin1ToLatin2(html);
  let markerIndex = page.indexOf('e, wejrzyj ku wspomo');

  if (markerIndex < 10) {
    return '';
  }

  markerIndex = page.lastIndexOf('<div class', markerIndex);
  if (markerIndex < 10) {
    return '';
  }

  page = page.slice(markerIndex);

  markerIndex = page.indexOf('Wydawnictwo Pallottinum');
  if (markerIndex < 10) {
    return '';
  }

  markerIndex = page.lastIndexOf('</table', markerIndex);
  if (markerIndex < 10) {
    return '';
  }

  page = page.slice(0, markerIndex);

  for (const premiumMarker of ['premium.brewiarz.pl', 'access.php3']) {
    let premiumIndex = page.indexOf(premiumMarker);

    while (premiumIndex > 0) {
      const start = page.lastIndexOf('<div', premiumIndex);
      const closingDiv = page.indexOf('</div', premiumIndex);
      const end = closingDiv > -1 ? page.indexOf('>', closingDiv) : -1;

      if (start < 0 || closingDiv < 0 || end < 0) {
        break;
      }

      page = page.slice(0, start) + page.slice(end + 1);
      premiumIndex = page.indexOf(premiumMarker);
    }
  }

  return page
    .replace(/color:\s*black/gi, ' ')
    .replace(/font-size:\s*10pt/gi, ' ')
    .replace(/font-size:\s*7\.5pt/gi, 'font-size:9pt')
    .replace(/font-size:\s*8pt;/gi, 'font-size:10pt; ')
    .replace(/<a[^>]*href="[^"]*off=1[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<a[^>]*href="[^"]*premium\.brewiarz\.pl[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/&#134;|&dagger;/gi, '†')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;|&rsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;/gi, '"')
    .replace(/&ndash;|&mdash;/gi, '-')
    .replace(/&hellip;/gi, '...')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&Oacute;/gi, 'Ó')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalizeText(value: string) {
  return decodeHtml(value)
    .replace(/W wersji PREMIUM[\s\S]*?(?=\n|$)/gi, '')
    .replace(/Możliwość wydruku dostępna wyłącznie[\s\S]*?(?=\n|$)/gi, '')
    .replace(/Powrót do góry/gi, '')
    .replace(/Pomoc(?:\s*\|\s*)?/gi, '')
    .replace(/STRONA GŁÓWNA[\s\S]*?Teksty Liturgii Godzin:/gi, '')
    .replace(/Teksty Liturgii Godzin:[\s\S]*$/gi, '')
    .replace(/©\s*Copyright[\s\S]*$/gi, '')
    .replace(/^var\s+\w+\s*=\s*new\s+ddtabcontent[\s\S]*$/gim, '')
    .replace(/^\w+\.setpersist\([\s\S]*$/gim, '')
    .replace(/^\w+\.setselectedClassTarget\([\s\S]*$/gim, '')
    .replace(/^\w+\.init\(\)\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractSectionChunk(html: string, title: string) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const otherTitles = SECTION_TITLES.map((value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('|');
  const pattern = new RegExp(
    `<font color=red><b>${escapedTitle}<\\/b><\\/font>[\\s\\S]*?(?=<font color=red><b>(?:${otherTitles})<\\/b><\\/font>|<div align=center style="font-family:tahoma; font-size:10pt"|$)`,
    'i'
  );

  return html.match(pattern)?.[0] ?? '';
}

function extractSectionVariants(chunk: string): BreviarySectionVariant[] {
  const variantLabels = new Map<string, string>();

  for (const match of chunk.matchAll(
    /<li><a href="#" rel="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/li>/gi
  )) {
    const variantId = match[1]?.trim();
    const variantLabel = decodeHtml(match[2] ?? '').trim();

    if (!variantId || !variantLabel) {
      continue;
    }

    variantLabels.set(variantId, variantLabel);
  }

  const variants: BreviarySectionVariant[] = [];
  const variantPattern =
    /<div id="([^"]+)" class="tabcontent"[^>]*>([\s\S]*?)(?=<div id="[^"]+" class="tabcontent"|<script type="text\/javascript">\s*var countries|<br>\s*<A name=|$)/gi;

  for (const match of chunk.matchAll(variantPattern)) {
    const variantId = match[1]?.trim();
    const variantBody = normalizeText(match[2] ?? '');

    if (!variantId || !variantBody) {
      continue;
    }

    variants.push({
      id: variantId,
      label: variantLabels.get(variantId) ?? `Wariant ${variants.length + 1}`,
      body: variantBody,
    });
  }

  return variants;
}

function removeVariantMarkup(chunk: string) {
  return chunk
    .replace(/<ul[^>]*class="shadetabs2"[\s\S]*?<\/ul><br>/gi, '')
    .replace(
      /<div id="[^"]+" class="tabcontent"[\s\S]*?(?=<div id="[^"]+" class="tabcontent"|<script type="text\/javascript">\s*var countries|<br>\s*<A name=|$)/gi,
      ''
    )
    .replace(/<script type="text\/javascript">[\s\S]*?countries\w+[\s\S]*?<\/script>/gi, '');
}

function buildSections(html: string) {
  const sections: BreviarySection[] = [];

  for (const title of SECTION_TITLES) {
    const chunk = extractSectionChunk(html, title);

    if (!chunk) {
      continue;
    }

    const sectionWithoutTitle = chunk.replace(
      new RegExp(`<font color=red><b>${title}<\\/b><\\/font>`, 'i'),
      ''
    );
    const variants = extractSectionVariants(sectionWithoutTitle);
    const body = normalizeText(removeVariantMarkup(sectionWithoutTitle));

    if (!body && variants.length === 0) {
      continue;
    }

    sections.push({
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      body: variants[0]?.body ?? body,
      variants: variants.length > 1 ? variants : undefined,
    });
  }

  return sections;
}

function parseBreviaryOffice(
  html: string,
  office: BreviaryOfficeId,
  sourceUrl: string
): BreviaryOffice {
  const convertedHtml = convertPageLikePkar70(html);
  const sectionSourceHtml = convertedHtml || html;
  const dateMatch = html.match(
    /<div style="font-size: 16pt; font-weight:bold; font-family:verdana">\s*([\s\S]*?)\s*<\/div>/i
  );
  const psalterWeekMatch = html.match(
    /<div style="font-size: 12pt; font-weight:normal; font-family:arial; color:navy">\s*([\s\S]*?)\s*<\/div>/i
  );
  const seasonMatch = html.match(
    /<div style="font-size: 12pt; font-weight:normal; font-family:arial; color:black">\s*([\s\S]*?)\s*<\/div>/i
  );
  const liturgicalDayMatch = html.match(
    /<b><div style="font-size:10pt;font-family:tahoma">\s*([\s\S]*?)\s*<\/div><\/b>/i
  );

  return {
    date: decodeHtml(latin1ToLatin2(dateMatch?.[1] ?? '')),
    liturgicalDay: liturgicalDayMatch ? decodeHtml(latin1ToLatin2(liturgicalDayMatch[1])) : undefined,
    psalterWeek: psalterWeekMatch ? decodeHtml(latin1ToLatin2(psalterWeekMatch[1])) : undefined,
    season: seasonMatch ? decodeHtml(latin1ToLatin2(seasonMatch[1])) : undefined,
    office,
    officeLabel: OFFICE_CONFIG[office].label,
    sourceUrl,
    sections: buildSections(sectionSourceHtml),
  };
}

export const brewiarzApi = createApi({
  reducerPath: 'brewiarzApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://brewiarz.pl',
    responseHandler: async (response) => {
      const buffer = await response.arrayBuffer();
      return decodeLatin1(new Uint8Array(buffer));
    },
  }),
  endpoints: (builder) => ({
    getBreviaryOffice: builder.query<BreviaryOffice, BreviaryOfficeId>({
      async queryFn(office, _api, _extraOptions, fetchWithBQ) {
        const date = new Date();

        for (const indexUrl of getIndexUrlCandidates(date)) {
          const indexResult = await fetchWithBQ({ url: indexUrl });

          if ('error' in indexResult || typeof indexResult.data !== 'string') {
            continue;
          }

          const resolvedOfficeUrl = extractOfficeUrlFromIndex(indexResult.data, office, date);

          if (!resolvedOfficeUrl) {
            continue;
          }

          const officeResult = await fetchWithBQ({ url: resolvedOfficeUrl });

          if ('error' in officeResult || typeof officeResult.data !== 'string') {
            continue;
          }

          if (!hasBreviaryContent(officeResult.data)) {
            continue;
          }

          return {
            data: parseBreviaryOffice(
              officeResult.data,
              office,
              `https://brewiarz.pl${resolvedOfficeUrl}`
            ),
          };
        }

        for (const officeUrl of getOfficeUrlCandidates(date, office)) {
          const officeResult = await fetchWithBQ({ url: officeUrl });

          if ('error' in officeResult || typeof officeResult.data !== 'string') {
            continue;
          }

          if (!hasBreviaryContent(officeResult.data)) {
            continue;
          }

          return {
            data: parseBreviaryOffice(officeResult.data, office, `https://brewiarz.pl${officeUrl}`),
          };
        }

        return {
          error: {
            status: 'CUSTOM_ERROR',
            error: `Nie znaleziono poprawnej strony brewiarza dla "${office}".`,
          },
        };
      },
    }),
  }),
});

export const { useGetBreviaryOfficeQuery } = brewiarzApi;
