import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  clearPersistentCacheByPrefix,
  makeDailyCacheKey,
  usePersistentCache,
} from './usePersistentCache';

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
  variants?: { id: string; label: string; body: string }[];
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

const CACHE_PREFIX = 'pg.brewiarz.';

const OFFICE_CONFIG: Record<BreviaryOfficeId, { fileName: string; label: string }> = {
  'godzina-czytan': { fileName: 'godzczyt.php3', label: 'Godzina czytań' },
  jutrznia: { fileName: 'jutrznia.php3', label: 'Jutrznia' },
  'modlitwa-przedpoludniowa': { fileName: 'modlitwa1.php3', label: 'Modlitwa przedpołudniowa' },
  'modlitwa-poludniowa': { fileName: 'modlitwa2.php3', label: 'Modlitwa południowa' },
  'modlitwa-popoludniowa': { fileName: 'modlitwa3.php3', label: 'Modlitwa popołudniowa' },
  nieszpory: { fileName: 'nieszpory.php3', label: 'Nieszpory' },
  kompleta: { fileName: 'kompleta.php3', label: 'Kompleta' },
};

const SECTION_TITLES = [
  'HYMN', 'PSALMODIA', 'CZYTANIE', 'RESPONSORIUM KRÓTKIE', 'RESPONSORIUM',
  'PIEŚŃ ZACHARIASZA', 'PIEŚŃ MARYI', 'PROŚBY', 'MODLITWA',
] as const;

function decodeLatin1(bytes: Uint8Array) {
  let result = '';
  for (const byte of bytes) result += String.fromCharCode(byte);
  return result;
}

function latin1ToLatin2(v: string) {
  return v
    .replace(/±/g, 'ą').replace(/æ/g, 'ć').replace(/ê/g, 'ę')
    .replace(/³/g, 'ł').replace(/ñ/g, 'ń').replace(/¶/g, 'ś')
    .replace(/¿/g, 'ż').replace(/¼/g, 'ź').replace(/¡/g, 'Ą')
    .replace(/Æ/g, 'Ć').replace(/Ê/g, 'Ę').replace(/£/g, 'Ł')
    .replace(/Ñ/g, 'Ń').replace(/¦/g, 'Ś').replace(/¯/g, 'Ż')
    .replace(/¬/g, 'Ź');
}

function getMonthDirectory(m: number) {
  return ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii'][m];
}

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthPrefix(date: Date) {
  return `/${getMonthDirectory(date.getMonth())}_${String(date.getFullYear()).slice(-2)}`;
}

function getDayDirectoryCandidates(date: Date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const tok = `${d}${m}`;
  return [tok, `${tok}p`, `${tok}w1`, `${tok}w2`, `${tok}w3`, `${tok}w4`];
}

function getOfficeUrlCandidates(date: Date, office: BreviaryOfficeId) {
  const prefix = getMonthPrefix(date);
  const fn = OFFICE_CONFIG[office].fileName;
  return getDayDirectoryCandidates(date).map((dir) => `${prefix}/${dir}/${fn}`);
}

function getIndexUrlCandidates(date: Date) {
  const prefix = getMonthPrefix(date);
  return getDayDirectoryCandidates(date).map((dir) => `${prefix}/${dir}/index.php3?l=i`);
}

function extractOfficeUrlFromIndex(html: string, office: BreviaryOfficeId, date: Date) {
  const fn = OFFICE_CONFIG[office].fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const prefix = getMonthPrefix(date).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const abs = html.match(new RegExp(`href="(${prefix}\\/[^"]*\\/${fn})"`, 'i'));
  if (abs?.[1]) return abs[1];
  const rel = html.match(new RegExp(`href="([^"]*${fn})"`, 'i'));
  if (!rel?.[1]) return null;
  return rel[1].startsWith('/') ? rel[1] : null;
}

function hasBreviaryContent(html: string) {
  return html.includes('wejrzyj ku wspomo') ||
    html.includes('<font color=red><b>HYMN</b></font>') ||
    html.includes('Wydawnictwo Pallottinum');
}

function convertPageLikePkar70(html: string) {
  let page = latin1ToLatin2(html);
  let idx = page.indexOf('e, wejrzyj ku wspomo');
  if (idx < 10) return '';
  idx = page.lastIndexOf('<div class', idx);
  if (idx < 10) return '';
  page = page.slice(idx);
  idx = page.indexOf('Wydawnictwo Pallottinum');
  if (idx < 10) return '';
  idx = page.lastIndexOf('</table', idx);
  if (idx < 10) return '';
  page = page.slice(0, idx);
  for (const marker of ['premium.brewiarz.pl', 'access.php3']) {
    let pi = page.indexOf(marker);
    while (pi > 0) {
      const start = page.lastIndexOf('<div', pi);
      const closing = page.indexOf('</div', pi);
      const end = closing > -1 ? page.indexOf('>', closing) : -1;
      if (start < 0 || closing < 0 || end < 0) break;
      page = page.slice(0, start) + page.slice(end + 1);
      pi = page.indexOf(marker);
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

function decodeHtmlStr(v: string) {
  return v
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
    .replace(/&oacute;/gi, 'ó').replace(/&Oacute;/gi, 'Ó')
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalizeText(v: string) {
  return decodeHtmlStr(v)
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
  const et = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const others = (SECTION_TITLES as readonly string[]).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const pattern = new RegExp(
    `<font color=red><b>${et}<\\/b><\\/font>[\\s\\S]*?(?=<font color=red><b>(?:${others})<\\/b><\\/font>|<div align=center style="font-family:tahoma; font-size:10pt"|$)`,
    'i'
  );
  return html.match(pattern)?.[0] ?? '';
}

function extractSectionVariants(chunk: string) {
  const labels = new Map<string, string>();
  for (const m of chunk.matchAll(/<li><a href="#" rel="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/li>/gi)) {
    const id = m[1]?.trim(); const label = decodeHtmlStr(m[2] ?? '').trim();
    if (id && label) labels.set(id, label);
  }
  const variants: { id: string; label: string; body: string }[] = [];
  const pat = /<div id="([^"]+)" class="tabcontent"[^>]*>([\s\S]*?)(?=<div id="[^"]+" class="tabcontent"|<script type="text\/javascript">\s*var countries|<br>\s*<A name=|$)/gi;
  for (const m of chunk.matchAll(pat)) {
    const id = m[1]?.trim(); const body = normalizeText(m[2] ?? '');
    if (id && body) variants.push({ id, label: labels.get(id) ?? `Wariant ${variants.length + 1}`, body });
  }
  return variants;
}

function removeVariantMarkup(chunk: string) {
  return chunk
    .replace(/<ul[^>]*class="shadetabs2"[\s\S]*?<\/ul><br>/gi, '')
    .replace(/<div id="[^"]+" class="tabcontent"[\s\S]*?(?=<div id="[^"]+" class="tabcontent"|<script type="text\/javascript">\s*var countries|<br>\s*<A name=|$)/gi, '')
    .replace(/<script type="text\/javascript">[\s\S]*?countries\w+[\s\S]*?<\/script>/gi, '');
}

function buildSections(html: string): BreviarySection[] {
  const sections: BreviarySection[] = [];
  for (const title of SECTION_TITLES) {
    const chunk = extractSectionChunk(html, title);
    if (!chunk) continue;
    const withoutTitle = chunk.replace(new RegExp(`<font color=red><b>${title}<\\/b><\\/font>`, 'i'), '');
    const variants = extractSectionVariants(withoutTitle);
    const body = normalizeText(removeVariantMarkup(withoutTitle));
    if (!body && variants.length === 0) continue;
    sections.push({
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      body: variants[0]?.body ?? body,
      variants: variants.length > 1 ? variants : undefined,
    });
  }
  return sections;
}

function parseBreviaryOffice(html: string, office: BreviaryOfficeId, sourceUrl: string): BreviaryOffice {
  const converted = convertPageLikePkar70(html);
  const src = converted || html;
  const dateM = html.match(/<div style="font-size: 16pt; font-weight:bold; font-family:verdana">\s*([\s\S]*?)\s*<\/div>/i);
  const psalterM = html.match(/<div style="font-size: 12pt; font-weight:normal; font-family:arial; color:navy">\s*([\s\S]*?)\s*<\/div>/i);
  const seasonM = html.match(/<div style="font-size: 12pt; font-weight:normal; font-family:arial; color:black">\s*([\s\S]*?)\s*<\/div>/i);
  const liturgicalM = html.match(/<b><div style="font-size:10pt;font-family:tahoma">\s*([\s\S]*?)\s*<\/div><\/b>/i);
  return {
    date: decodeHtmlStr(latin1ToLatin2(dateM?.[1] ?? '')),
    liturgicalDay: liturgicalM ? decodeHtmlStr(latin1ToLatin2(liturgicalM[1])) : undefined,
    psalterWeek: psalterM ? decodeHtmlStr(latin1ToLatin2(psalterM[1])) : undefined,
    season: seasonM ? decodeHtmlStr(latin1ToLatin2(seasonM[1])) : undefined,
    office,
    officeLabel: OFFICE_CONFIG[office].label,
    sourceUrl,
    sections: buildSections(src),
  };
}

async function fetchBreviaryOffice(office: BreviaryOfficeId): Promise<BreviaryOffice> {
  const date = new Date();

  async function fetchHtml(path: string): Promise<string | null> {
    try {
      const r = await fetch(`/brewiarz-proxy${path}`);
      if (!r.ok) return null;
      const buf = await r.arrayBuffer();
      return decodeLatin1(new Uint8Array(buf));
    } catch {
      return null;
    }
  }

  for (const indexUrl of getIndexUrlCandidates(date)) {
    const indexHtml = await fetchHtml(indexUrl);
    if (!indexHtml) continue;
    const officeUrl = extractOfficeUrlFromIndex(indexHtml, office, date);
    if (!officeUrl) continue;
    const officeHtml = await fetchHtml(officeUrl);
    if (!officeHtml || !hasBreviaryContent(officeHtml)) continue;
    return parseBreviaryOffice(officeHtml, office, `https://brewiarz.pl${officeUrl}`);
  }

  for (const officeUrl of getOfficeUrlCandidates(date, office)) {
    const officeHtml = await fetchHtml(officeUrl);
    if (!officeHtml || !hasBreviaryContent(officeHtml)) continue;
    return parseBreviaryOffice(officeHtml, office, `https://brewiarz.pl${officeUrl}`);
  }

  throw new Error(`Nie znaleziono treści brewiarza dla "${office}".`);
}

export function useBreviary(office: BreviaryOfficeId) {
  const date = formatDateKey(new Date());
  const cacheKey = makeDailyCacheKey('brewiarz', date, office);
  const cache = usePersistentCache<BreviaryOffice>(cacheKey);

  useEffect(() => {
    clearPersistentCacheByPrefix(CACHE_PREFIX, (key) => key.endsWith(`.${date}`));
  }, [date]);

  const query = useQuery({
    queryKey: ['breviary', office, date],
    queryFn: async () => {
      const data = await fetchBreviaryOffice(office);
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

export { OFFICE_CONFIG };
