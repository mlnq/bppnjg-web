import type { Akapit, SrtCue } from '../data/types';

// ——— TXT: pusta linia = nowy akapit. Domyślnie typ 'p'. ———
export function txtNaAkapity(txt: string): Akapit[] {
  return txt
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((blok) => blok.trim().replace(/\n/g, ' '))
    .filter(Boolean)
    .map((t) => ({ typ: 'p', t }));
}

// ——— SRT: scal cue'y w akapity. Nowy akapit, gdy przerwa między cue'ami
//     przekracza `progMs` (domyślnie 2,2 s — naturalna pauza). ———
export function srtNaAkapity(srt: string, progMs = 2200): Akapit[] {
  const cues = srtNaCues(srt);

  const akapity: Akapit[] = [];
  let buf = '';
  let prevEnd = -Infinity;
  for (const c of cues) {
    if (buf && c.start - prevEnd > progMs) {
      akapity.push({ typ: 'p', t: buf.trim() });
      buf = '';
    }
    buf += (buf ? ' ' : '') + c.text;
    prevEnd = c.end;
  }
  if (buf.trim()) akapity.push({ typ: 'p', t: buf.trim() });
  return akapity;
}

/** Parses timed SRT cues for synchronized transcript rendering. */
export function srtNaCues(srt: string): SrtCue[] {
  const cues: SrtCue[] = [];

  for (const blok of srt.replace(/\r\n/g, '\n').trim().split(/\n{2,}/)) {
    const linie = blok.split('\n');
    const tcIdx = linie.findIndex((l) => l.includes('-->'));
    if (tcIdx === -1) continue;
    const [start, end] = linie[tcIdx].split('-->').map((s) => czasNaMs(s));
    const text = linie.slice(tcIdx + 1).join(' ').trim();
    if (text) cues.push({ start, end, text });
  }

  return cues;
}

// "00:01:23,456" lub "00:01:23.456" -> milisekundy
function czasNaMs(s: string): number {
  const m = s.trim().replace(',', '.').match(/(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  return (+m[1] * 3600 + +m[2] * 60 + parseFloat(m[3])) * 1000;
}
