# Moduł Konferencje (audio + transkrypcja) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the text-only "Konferencja dnia" reader with an MP3 player + readable transcript (the "Słuchowisko" hi-fi variant), plus a new archive/list screen, per `docs/superpowers/specs/2026-07-15-konferencje-audio-module-design.md`.

**Architecture:** Two screens under `src/features/konferencja/`: a list screen (`index.tsx`, route `/konferencja`) and a player screen (`Player.tsx`, route `/konferencja/:nr`, `:nr` = pilgrimage day number, unchanged from today). A new `Konferencja` data type + `api.getKonferencje()`/`api.getKonferencja(nr)` follow the existing seed/fetch pattern in `src/data/api.ts`. Audio playback is driven by a new `useAudioKonferencja` hook wrapping a real `<audio>` element; transcripts are parsed from SRT/TXT via a new `srt-txt.ts` utility, both copied near-verbatim from the approved design handoff.

**Tech Stack:** React 18, TypeScript, react-router-dom v6, @tanstack/react-query v5, vite-plugin-pwa (workbox), vitest.

## Global Constraints

- Route stays `/konferencja/:nr` with `nr` = numeric pilgrimage day number — do not rename the param or switch to slug-based routing.
- Data model follows the simplified API contract only: `id, tytul, autor, mp3Url, srtUrl` (+ derived `akapity`). Never add `dzien`, `funkcja`, `stan`, `peaks`, or per-item listened/upcoming state anywhere in new code.
- New CSS uses only existing custom properties from `src/styles/tokens.css` (no new tokens).
- No unit tests for UI components or the audio hook (matches existing project convention — no component tests exist anywhere in the repo). Only pure functions (`srt-txt.ts`, the `konferencjaId`/`konferencjaNr` helpers) get vitest tests.
- Follow the existing repo naming convention (seen in `kwatermistrz`/`niezbednik`): `index.tsx` exports the list screen as `<Feature>Screen`; the detail screen lives in its own file with its own name.

---

### Task 1: Konferencja types + SRT/TXT transcript parser

**Files:**
- Modify: `src/data/types.ts` (append at end of file)
- Create: `src/lib/srt-txt.ts`
- Test: `src/lib/srt-txt.test.ts`

**Interfaces:**
- Produces: `Konferencja` type (`id: string, tytul: string, autor: string, mp3Url: string, srtUrl: string, akapity?: Akapit[]`), `KonferencjaListItem` type (`Pick<Konferencja, 'id'|'tytul'|'autor'>`), `srtNaAkapity(srt: string, progMs?: number): Akapit[]`, `txtNaAkapity(txt: string): Akapit[]` — all consumed by Task 2 (`api.ts`) and Task 6/7 (screens).

- [ ] **Step 1: Add the `Konferencja` types to `src/data/types.ts`**

Append at the end of the file (after the existing `ContentModule` type):

```ts

export type Konferencja = {
  id: string;
  tytul: string;
  autor: string;
  mp3Url: string;
  srtUrl: string;
  akapity?: Akapit[];
};

export type KonferencjaListItem = Pick<Konferencja, 'id' | 'tytul' | 'autor'>;
```

- [ ] **Step 2: Write the failing test for the transcript parser**

Create `src/lib/srt-txt.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { srtNaAkapity, txtNaAkapity } from './srt-txt';

describe('txtNaAkapity', () => {
  it('splits on blank lines into paragraphs', () => {
    const txt = 'Pierwszy akapit.\n\nDrugi akapit\nz dwoma liniami.\n\nTrzeci.';
    expect(txtNaAkapity(txt)).toEqual([
      { typ: 'p', t: 'Pierwszy akapit.' },
      { typ: 'p', t: 'Drugi akapit z dwoma liniami.' },
      { typ: 'p', t: 'Trzeci.' },
    ]);
  });

  it('ignores trailing whitespace and empty input', () => {
    expect(txtNaAkapity('   \n\n  ')).toEqual([]);
  });
});

describe('srtNaAkapity', () => {
  const srt = [
    '1',
    '00:00:00,000 --> 00:00:02,000',
    'Pierwsze zdanie.',
    '',
    '2',
    '00:00:02,500 --> 00:00:04,000',
    'Drugie zdanie, ta sama pauza.',
    '',
    '3',
    '00:00:10,000 --> 00:00:12,000',
    'Nowy akapit po dłuższej ciszy.',
  ].join('\n');

  it('merges cues separated by a short gap into one paragraph', () => {
    const akapity = srtNaAkapity(srt);
    expect(akapity[0]).toEqual({ typ: 'p', t: 'Pierwsze zdanie. Drugie zdanie, ta sama pauza.' });
  });

  it('starts a new paragraph after a gap longer than progMs', () => {
    const akapity = srtNaAkapity(srt);
    expect(akapity).toHaveLength(2);
    expect(akapity[1]).toEqual({ typ: 'p', t: 'Nowy akapit po dłuższej ciszy.' });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/lib/srt-txt.test.ts`
Expected: FAIL — `Failed to resolve import "./srt-txt"` (file doesn't exist yet).

- [ ] **Step 4: Create `src/lib/srt-txt.ts`**

```ts
import type { Akapit } from '../data/types';

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
  type Cue = { start: number; end: number; tekst: string };
  const cues: Cue[] = [];

  for (const blok of srt.replace(/\r\n/g, '\n').trim().split(/\n{2,}/)) {
    const linie = blok.split('\n');
    const tcIdx = linie.findIndex((l) => l.includes('-->'));
    if (tcIdx === -1) continue;
    const [a, z] = linie[tcIdx].split('-->').map((s) => czasNaMs(s));
    const tekst = linie.slice(tcIdx + 1).join(' ').trim();
    if (tekst) cues.push({ start: a, end: z, tekst });
  }

  const akapity: Akapit[] = [];
  let buf = '';
  let prevEnd = -Infinity;
  for (const c of cues) {
    if (buf && c.start - prevEnd > progMs) {
      akapity.push({ typ: 'p', t: buf.trim() });
      buf = '';
    }
    buf += (buf ? ' ' : '') + c.tekst;
    prevEnd = c.end;
  }
  if (buf.trim()) akapity.push({ typ: 'p', t: buf.trim() });
  return akapity;
}

// "00:01:23,456" lub "00:01:23.456" -> milisekundy
function czasNaMs(s: string): number {
  const m = s.trim().replace(',', '.').match(/(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  return (+m[1] * 3600 + +m[2] * 60 + parseFloat(m[3])) * 1000;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/srt-txt.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/data/types.ts src/lib/srt-txt.ts src/lib/srt-txt.test.ts
git commit -m "Add Konferencja types and SRT/TXT transcript parser"
```

---

### Task 2: Seed data + `api.ts` data layer

**Files:**
- Create: `src/data/seeds/konferencje.json`
- Modify: `src/data/api.ts`
- Test: `src/data/api.test.ts`

**Interfaces:**
- Consumes: `Konferencja`, `KonferencjaListItem` (Task 1), `srtNaAkapity` (Task 1).
- Produces: `konferencjaId(nr: number): string`, `konferencjaNr(id: string): number`, `api.getKonferencje(): Promise<KonferencjaListItem[]>`, `api.getKonferencja(nr: number): Promise<Konferencja>` — consumed by Task 6 (Player) and Task 7 (list screen).

- [ ] **Step 1: Create the seed file**

Create `src/data/seeds/konferencje.json`:

```json
[
  {
    "id": "dzien-01",
    "tytul": "Po co komu pielgrzymka",
    "autor": "ks. Tomasz Wadowski",
    "mp3Url": "/audio/konferencje/dzien-01.mp3",
    "srtUrl": "/audio/konferencje/dzien-01.srt",
    "akapity": [
      { "typ": "lead", "t": "Można pojechać autobusem i być na Jasnej Górze za pół dnia. Skoro chodzi o cel, po co iść dwa tygodnie pieszo? Bo na pielgrzymce celem nie jest tylko miejsce." },
      { "typ": "p", "t": "Idziemy, żeby coś zostawić po drodze. Pośpiech, hałas, przekonanie, że wszystko zależy od nas. Każdy kilometr odejmuje po trochu z tego bagażu, którego nie widać." },
      { "typ": "resp", "t": "W: Któryś za nas cierpiał rany. O: Jezu Chryste, zmiłuj się nad nami." }
    ]
  },
  {
    "id": "dzien-02",
    "tytul": "Pierwszy krok należy do Boga",
    "autor": "ks. Andrzej Lemann",
    "mp3Url": "/audio/konferencje/dzien-02.mp3",
    "srtUrl": "/audio/konferencje/dzien-02.srt",
    "akapity": [
      { "typ": "lead", "t": "Drugi dzień jest dniem prawdy. Zachwyt pierwszego poranka już opadł, a do celu wciąż daleko. Zostaje samo postanowienie: idę dalej." },
      { "typ": "verse", "t": "„Nie wyście Mnie wybrali, ale Ja was wybrałem.” (J 15,16)" },
      { "typ": "p", "t": "Dzisiejszy trud nie jest tylko twoim wysiłkiem. Pierwszy krok należał do Tego, który cię tu przyprowadził. Twoim zadaniem jest tylko nie zawrócić." }
    ]
  },
  {
    "id": "dzien-03",
    "tytul": "Iść w rytmie, który nie jest twój",
    "autor": "ks. Tomasz Wadowski",
    "mp3Url": "/audio/konferencje/dzien-03.mp3",
    "srtUrl": "/audio/konferencje/dzien-03.srt",
    "akapity": [
      { "typ": "lead", "t": "Pierwszego dnia każdy idzie tak, jak chce. Drugiego — tak, jak musi. Trzeci dzień jest najtrudniejszy, bo to dzień, w którym uczysz się iść tak, jak idzie grupa." },
      { "typ": "drop", "t": "Pielgrzymka ma swój rytm i ten rytm nie pyta cię o zdanie. Wstajesz, gdy jeszcze ciemno. Idziesz, gdy słońce dopiero ogrzewa pola. Zatrzymujesz się nie wtedy, kiedy ty jesteś zmęczony, ale wtedy, kiedy zmęczony jest ktoś obok ciebie." },
      { "typ": "p", "t": "Łatwo to powiedzieć przy stole. Trudniej, kiedy trzydziesty kilometr, a do noclegu jeszcze godzina. I właśnie w tym napięciu dzieje się coś ważnego." },
      { "typ": "h3", "t": "Krok, który nie należy do ciebie" },
      { "typ": "p", "t": "Kiedy dopasowujesz krok do drugiego człowieka, oddajesz coś ze swojej wolności. Ale dostajesz w zamian coś, czego nie da się zdobyć w pojedynkę: poczucie, że nie idziesz sam." },
      { "typ": "verse", "t": "„Jedni drugich brzemiona noście, a tak wypełnicie prawo Chrystusowe.” (Ga 6,2)" },
      { "typ": "p", "t": "Trzeci dzień mija. Ale to dziś nauczysz się czegoś, co zostanie z tobą dłużej niż odciski: że najpiękniej idzie się w rytmie, którego się nie wybrało." }
    ]
  }
]
```

- [ ] **Step 2: Write the failing test for the id/nr helpers**

Create `src/data/api.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { konferencjaId, konferencjaNr } from './api';

describe('konferencjaId', () => {
  it('pads single-digit day numbers', () => {
    expect(konferencjaId(3)).toBe('dzien-03');
  });

  it('does not pad two-digit day numbers', () => {
    expect(konferencjaId(12)).toBe('dzien-12');
  });
});

describe('konferencjaNr', () => {
  it('extracts the day number from a slug', () => {
    expect(konferencjaNr('dzien-03')).toBe(3);
  });

  it('round-trips with konferencjaId', () => {
    expect(konferencjaNr(konferencjaId(7))).toBe(7);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx vitest run src/data/api.test.ts`
Expected: FAIL — `konferencjaId is not exported from './api'`.

- [ ] **Step 4: Add the helpers and API methods to `src/data/api.ts`**

Change the top imports from:

```ts
import type {
  BootstrapResponse, NewsResponse, QuartermasterResponse,
  RouteStateRequest, CurrentRouteStateDto,
} from './types';
import type { Dzien } from '../lib/position';
import type { ApiPilgrimageDay } from './types';

import bootstrapSeed from './seeds/bootstrap.json';
import newsSeed from './seeds/news.json';
import quartermasterSeed from './seeds/quartermaster.json';
```

to:

```ts
import type {
  BootstrapResponse, NewsResponse, QuartermasterResponse,
  RouteStateRequest, CurrentRouteStateDto, Konferencja, KonferencjaListItem,
} from './types';
import type { Dzien } from '../lib/position';
import type { ApiPilgrimageDay } from './types';
import { srtNaAkapity } from '../lib/srt-txt';

import bootstrapSeed from './seeds/bootstrap.json';
import newsSeed from './seeds/news.json';
import quartermasterSeed from './seeds/quartermaster.json';
import konferencjeSeed from './seeds/konferencje.json';
```

Add these two exported helpers after the `YEAR` constant:

```ts
export function konferencjaId(nr: number): string {
  return `dzien-${String(nr).padStart(2, '0')}`;
}

export function konferencjaNr(id: string): number {
  return Number(id.replace(/^dzien-/, ''));
}
```

Add these two methods inside the `api` object, after `getQuartermaster`:

```ts
  getKonferencje(): Promise<KonferencjaListItem[]> {
    if (USE_SEEDS) {
      return Promise.resolve(
        (konferencjeSeed as Konferencja[]).map(({ id, tytul, autor }) => ({ id, tytul, autor })),
      );
    }
    return fetchJson<KonferencjaListItem[]>('/api/konferencje');
  },

  async getKonferencja(nr: number): Promise<Konferencja> {
    const id = konferencjaId(nr);
    if (USE_SEEDS) {
      const found = (konferencjeSeed as Konferencja[]).find((k) => k.id === id);
      if (!found) throw new Error(`Konferencja ${id} not found`);
      return found;
    }
    const k = await fetchJson<Konferencja>(`/api/konferencje/${id}`);
    const srt = await fetch(k.srtUrl).then((r) => r.text());
    return { ...k, akapity: srtNaAkapity(srt) };
  },
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/data/api.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: Run the full test suite to check nothing broke**

Run: `npm test`
Expected: All existing + new tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/data/seeds/konferencje.json src/data/api.ts src/data/api.test.ts
git commit -m "Add konferencje seed data and api.getKonferencje/getKonferencja"
```

---

### Task 3: `useAudioKonferencja` hook

**Files:**
- Create: `src/lib/useAudioKonferencja.ts`

**Interfaces:**
- Produces: `useAudioKonferencja(nr: number, mp3Url: string, dlugosc?: number)` returning `{ ref, t, dur, pct, playing, rate, toggle, seek, skip, restart, cycleSpeed }`; `SPEEDS`, `SPEED_LBL` — consumed by Task 6 (Player).

- [ ] **Step 1: Create `src/lib/useAudioKonferencja.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

export const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
export const SPEED_LBL: Record<number, string> = {
  0.75: '0,75×', 1: '1×', 1.25: '1,25×', 1.5: '1,5×', 2: '2×',
};

export function useAudioKonferencja(nr: number, mp3Url: string, dlugosc = 0) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(dlugosc);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);

  const key = `pg.konf.${nr}`;

  useEffect(() => {
    const saved = Number(localStorage.getItem(key)) || 0;
    setT(saved);
    const el = ref.current;
    if (el) el.currentTime = saved;
    setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nr]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTime = () => {
      setT(el.currentTime);
      localStorage.setItem(key, String(Math.floor(el.currentTime)));
    };
    const onMeta = () => setDur(el.duration || dlugosc);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => setPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nr]);

  useEffect(() => { if (ref.current) ref.current.playbackRate = rate; }, [rate]);

  const toggle = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.paused ? el.play() : el.pause();
  }, []);

  const seek = useCallback((sec: number) => {
    const el = ref.current; if (!el) return;
    const max = dur || el.duration || 0;
    el.currentTime = Math.max(0, Math.min(max, sec));
  }, [dur]);

  const skip = useCallback((d: number) => {
    const el = ref.current; if (!el) return;
    seek(el.currentTime + d);
  }, [seek]);

  const restart = useCallback(() => seek(0), [seek]);

  const cycleSpeed = useCallback(() => {
    setRate((r) => SPEEDS[(SPEEDS.indexOf(r as typeof SPEEDS[number]) + 1) % SPEEDS.length]);
  }, []);

  const pct = dur ? Math.min(1, t / dur) : 0;

  return { ref, t, dur, pct, playing, rate, toggle, seek, skip, restart, cycleSpeed };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: No errors (this file has no consumers yet, so it just needs to compile standalone-correctly; `mp3Url` param is intentionally unused inside the hook, matching the handoff source — it's read by the JSX `<audio src>` in Task 6, not inside the hook).

- [ ] **Step 3: Commit**

```bash
git add src/lib/useAudioKonferencja.ts
git commit -m "Add useAudioKonferencja playback hook"
```

---

### Task 4: Konferencja CSS

**Files:**
- Modify: `src/styles/base.css` (append at end of file)

**Interfaces:**
- Produces: CSS classes `.konf`, `.konf-hero*`, `.konf-player`, `.konf-wave*`, `.konf-times*`, `.konf-controls`, `.konf-ctl*`, `.konf-play`, `.konf-speed`, `.konf-back`, `.konf-mini*`, `.konf-card*` — consumed by Task 5 (KonferencjaCard) and Task 6 (Player).

- [ ] **Step 1: Append the CSS block to `src/styles/base.css`**

Append at the end of the file:

```css

/* =============================================================================
   Konferencje — odtwarzacz (Player.tsx) + lista (KonferencjaCard.tsx).
   Używa wyłącznie istniejących tokenów z tokens.css.
   ============================================================================= */

/* ---- powłoka ekranu odtwarzacza ---- */
.konf { position: relative; height: 100dvh; overflow: hidden; }
.konf > .viewport { height: 100%; }

/* ---- LISTA: kafel konferencji (okrojony — bez pigułki dnia / stanu) ---- */
.konf-card {
  display: flex; align-items: center; gap: var(--s4); width: 100%; padding: var(--s4); text-align: left;
  background: var(--surface); border: 1px solid var(--line-2);
  border-radius: var(--r-card); box-shadow: var(--sh-card);
  transition: transform .14s, box-shadow .18s;
}
.konf-card:hover { transform: translateY(-1px); box-shadow: var(--sh-pop); }
.konf-card:active { transform: translateY(0) scale(.995); }
.konf-card__cover {
  width: 52px; height: 52px; flex: none; border-radius: 16px; color: #fff;
  display: flex; align-items: center; justify-content: center; box-shadow: var(--sh-sm);
  background: linear-gradient(155deg, var(--wine), var(--wine-700));
}
.konf-card__body { flex: 1; min-width: 0; }
.konf-card__title { font-family: var(--font-head); font-weight: 700; font-size: 16px; line-height: 1.22; color: var(--ink); letter-spacing: -.01em; }
.konf-card__autor { font-size: 13px; color: var(--ink-2); margin-top: 3px; }

/* ---- SZCZEGÓŁ: hero ---- */
.konf-hero {
  position: relative; padding: 64px var(--s5) var(--s6); color: #fff; overflow: hidden;
  background: linear-gradient(165deg, var(--wine) 0%, var(--wine-700) 70%, #4d0f24 100%);
}
.konf-hero__halo { position: absolute; right: -40px; top: -30px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,.06); }
.konf-hero__art { position: absolute; right: 24px; top: 30px; opacity: .16; }
.konf-hero__eyebrow { font-family: var(--font-head); font-size: 11.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--rose); position: relative; }
.konf-hero__title { font-family: var(--font-head); font-weight: 800; font-size: 27px; line-height: 1.12; letter-spacing: -.02em; margin: 10px 0 0; max-width: 88%; text-wrap: balance; position: relative; }
.konf-hero__by { display: flex; align-items: center; gap: 9px; margin-top: 14px; position: relative; font-size: 13.5px; color: rgba(255,255,255,.92); }
.konf-hero__av { width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,.16); display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-head); font-weight: 700; font-size: 12px; }

/* ---- SZCZEGÓŁ: karta odtwarzacza ---- */
.konf-player { margin-top: -44px; }
.konf-wave {
  display: flex; align-items: center; justify-content: space-between; gap: 2px;
  height: 50px; cursor: pointer; touch-action: none;
}
.konf-wave > span { width: 3px; border-radius: 3px; flex: none; transition: background .12s; }
.konf-times { display: flex; justify-content: space-between; margin-top: 8px; font-family: var(--font-head); font-weight: 700; font-size: 12px; color: var(--muted); }
.konf-times b { color: var(--wine); font-weight: 700; }
.konf-controls { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: var(--s4); }
.konf-ctl {
  position: relative; width: 46px; height: 46px; border-radius: 50%;
  background: var(--surface-soft); border: 1px solid var(--line); color: var(--wine);
  display: inline-flex; align-items: center; justify-content: center; flex: none;
}
.konf-ctl--sm { width: 40px; height: 40px; color: var(--ink-2); }
.konf-ctl__n { position: absolute; top: 53%; left: 50%; transform: translate(-50%,-50%); font-family: var(--font-head); font-weight: 800; font-size: 9px; letter-spacing: -.02em; }
.konf-play {
  width: 66px; height: 66px; border-radius: 50%; background: var(--wine); color: #fff; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 24px -10px rgba(124,29,63,.7);
}
.konf-speed {
  min-width: 40px; height: 40px; padding: 0 11px; border-radius: 999px; flex: none;
  background: var(--surface-soft); border: 1px solid var(--line); color: var(--wine);
  font-family: var(--font-head); font-weight: 800; font-size: 13px;
}

/* ---- SZCZEGÓŁ: cofnięty przycisk wstecz + pasek mini po przewinięciu ---- */
.konf-back {
  position: absolute; top: 16px; left: 14px; width: 40px; height: 40px; border-radius: 50%; z-index: 20;
  background: rgba(255,255,255,.18); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  color: #fff; display: inline-flex; align-items: center; justify-content: center; transition: opacity .2s;
}
.konf.is-scrolled .konf-back { opacity: 0; pointer-events: none; }
.konf-mini {
  position: absolute; top: 0; left: 0; right: 0; z-index: 25; display: flex; align-items: center; gap: 10px;
  padding: 10px var(--s4); border-bottom: 1px solid var(--line);
  background: color-mix(in oklab, var(--paper) 90%, transparent);
  backdrop-filter: blur(14px) saturate(1.2); -webkit-backdrop-filter: blur(14px) saturate(1.2);
  transform: translateY(-100%); opacity: 0; pointer-events: none;
  transition: transform .26s cubic-bezier(.22,1,.36,1), opacity .2s;
}
.konf.is-scrolled .konf-mini { transform: none; opacity: 1; pointer-events: auto; }
.konf-mini__play { width: 38px; height: 38px; border-radius: 50%; background: var(--wine); color: #fff; display: inline-flex; align-items: center; justify-content: center; flex: none; }
.konf-mini__bar { flex: 1; height: 4px; border-radius: 999px; background: var(--paper-sunk); overflow: hidden; }
.konf-mini__bar > i { display: block; height: 100%; background: var(--wine); border-radius: 999px; }
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/base.css
git commit -m "Add konferencje player and card CSS"
```

---

### Task 5: `KonferencjaCard` component

**Files:**
- Create: `src/features/konferencja/KonferencjaCard.tsx`

**Interfaces:**
- Consumes: `KonferencjaListItem` (Task 1), `.konf-card*` CSS classes (Task 4).
- Produces: `KonferencjaCard({ k: KonferencjaListItem, onOpen: () => void })` — consumed by Task 7 (list screen).

- [ ] **Step 1: Create `src/features/konferencja/KonferencjaCard.tsx`**

```tsx
import type { KonferencjaListItem } from '../../data/types';

type KonferencjaCardProps = {
  k: KonferencjaListItem;
  onOpen: () => void;
};

export function KonferencjaCard({ k, onOpen }: KonferencjaCardProps) {
  return (
    <button className="konf-card" onClick={onOpen}>
      <span className="konf-card__cover">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
          <rect x="3.2" y="13.4" width="4.4" height="7" rx="2" />
          <rect x="16.4" y="13.4" width="4.4" height="7" rx="2" />
        </svg>
      </span>
      <span className="konf-card__body">
        <span className="konf-card__title">{k.tytul}</span>
        <span className="konf-card__autor">{k.autor}</span>
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/konferencja/KonferencjaCard.tsx
git commit -m "Add trimmed KonferencjaCard list item"
```

---

### Task 6: `KonferencjaPlayer` detail screen

**Files:**
- Create: `src/features/konferencja/Player.tsx`

**Interfaces:**
- Consumes: `api.getKonferencja` (Task 2), `useAudioKonferencja`/`SPEED_LBL` (Task 3), `.konf*` CSS (Task 4), `Prose`/`Loader`/`Button` from `../../components`.
- Produces: `KonferencjaPlayer` component — consumed by Task 7 (App.tsx routing).

- [ ] **Step 1: Create `src/features/konferencja/Player.tsx`**

```tsx
import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Prose, Loader, Button } from '../../components';
import { useAudioKonferencja, SPEED_LBL } from '../../lib/useAudioKonferencja';
import { api } from '../../data/api';

const fmt = (s: number) => {
  s = Math.max(0, Math.round(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const FALLBACK_PEAKS = Array.from({ length: 46 }, (_, i) =>
  0.32 + 0.6 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.29 + 1.3)));

export function KonferencjaPlayer() {
  const { nr } = useParams<{ nr: string }>();
  const nav = useNavigate();
  const dayNr = Number(nr);

  const { data: k, isLoading } = useQuery({
    queryKey: ['konferencja', dayNr],
    queryFn: () => api.getKonferencja(dayNr),
  });

  const { ref, t, dur, pct, playing, rate, toggle, seek, skip, restart, cycleSpeed } =
    useAudioKonferencja(dayNr, k?.mp3Url ?? '');

  const [scrolled, setScrolled] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  const inicjaly = useMemo(() => {
    if (!k) return '';
    return k.autor.split(' ').filter((w) => /^[A-ZŻŹĆŁ]/.test(w)).map((w) => w[0]).slice(0, 2).join('');
  }, [k]);

  if (isLoading) return <Loader fullscreen />;

  if (!k) {
    return (
      <div className="viewport scroll">
        <div className="stage" style={{ paddingTop: 'var(--s10)', textAlign: 'center' }}>
          <p className="muted">Konferencja pojawi się przed etapem.</p>
          <div style={{ marginTop: 'var(--s5)' }}>
            <Button variant="ghost" icon="chevron-left" onClick={() => nav(-1)}>Wróć</Button>
          </div>
        </div>
      </div>
    );
  }

  const seekFromX = (clientX: number) => {
    const el = trackRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    seek(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * dur);
  };

  return (
    <div className={'konf' + (scrolled ? ' is-scrolled' : '')}>
      <audio ref={ref} src={k.mp3Url} preload="metadata" />

      <div className="viewport scroll" onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 180)}>
        <div className="konf-hero">
          <div className="konf-hero__halo" />
          <div className="konf-hero__art">
            <Headphones size={120} stroke="#fff" />
          </div>
          <div className="konf-hero__eyebrow">Konferencja · Dzień {dayNr}</div>
          <h1 className="konf-hero__title">{k.tytul}</h1>
          <div className="konf-hero__by">
            <span className="konf-hero__av">{inicjaly}</span>
            <span><b>{k.autor}</b></span>
          </div>
        </div>

        <div className="stage" style={{ paddingTop: 'var(--s5)' }}>
          <div className="card konf-player" style={{ padding: 'var(--s5)' }}>
            <div
              ref={trackRef}
              className="konf-wave"
              onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); seekFromX(e.clientX); }}
              onPointerMove={(e) => { if (dragging.current) seekFromX(e.clientX); }}
              onPointerUp={() => { dragging.current = false; }}
            >
              {FALLBACK_PEAKS.map((h, i) => {
                const on = (i / (FALLBACK_PEAKS.length - 1)) <= pct;
                return (
                  <span key={i} style={{
                    height: Math.round(h * 36) + 7,
                    background: on ? 'var(--wine)' : 'var(--paper-sunk)',
                  }} />
                );
              })}
            </div>

            <div className="konf-times"><b>{fmt(t)}</b><span>{fmt(dur)}</span></div>

            <div className="konf-controls">
              <button className="konf-ctl konf-ctl--sm" onClick={restart} title="Od początku">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18 19 8 12l10-7z" /><rect x="5" y="5" width="2.2" height="14" rx="1" /></svg>
              </button>
              <button className="konf-ctl" onClick={() => skip(-10)} title="10 sekund wstecz">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a8 8 0 1 1-7.6 5.6" /><path d="M4 4v5h5" /></svg>
                <span className="konf-ctl__n">10</span>
              </button>
              <button className="konf-play" onClick={toggle} aria-label={playing ? 'Pauza' : 'Odtwórz'}>
                {playing
                  ? <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="5" width="3.4" height="14" rx="1.2" /><rect x="13.6" y="5" width="3.4" height="14" rx="1.2" /></svg>
                  : <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5.2v13.6L19 12z" /></svg>}
              </button>
              <button className="konf-ctl" onClick={() => skip(10)} title="10 sekund naprzód">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a8 8 0 1 0 7.6 5.6" /><path d="M20 4v5h-5" /></svg>
                <span className="konf-ctl__n">10</span>
              </button>
              <button className="konf-speed" onClick={cycleSpeed} title="Prędkość">{SPEED_LBL[rate]}</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 'var(--s7) 0 var(--s4)' }}>
            <span className="eyebrow eyebrow--wine">Transkrypcja nagrania</span>
            <span className="localnote" style={{ marginLeft: 'auto' }}>do czytania</span>
          </div>
          <Prose akapity={k.akapity ?? []} dropcap />

          <div className="center" style={{ marginTop: 'var(--s6)' }}>
            <span className="localnote">Zapisane offline — nagranie i tekst</span>
          </div>
        </div>
      </div>

      <button className="konf-back" onClick={() => nav(-1)} aria-label="Wstecz">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>

      <div className="konf-mini">
        <button className="hdr__btn left" style={{ width: 38, height: 38, flex: 'none' }} onClick={() => nav(-1)} aria-label="Wstecz">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button className="konf-mini__play" onClick={toggle} aria-label={playing ? 'Pauza' : 'Odtwórz'}>
          {playing
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="5" width="3.4" height="14" rx="1.2" /><rect x="13.6" y="5" width="3.4" height="14" rx="1.2" /></svg>
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><path d="M8 5.2v13.6L19 12z" /></svg>}
        </button>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.tytul}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span className="konf-mini__bar"><i style={{ width: pct * 100 + '%' }} /></span>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 10.5, color: 'var(--muted)' }}>{fmt(t)}</span>
          </span>
        </span>
        <button className="konf-speed" style={{ minWidth: 36, height: 30, fontSize: 12 }} onClick={cycleSpeed}>{SPEED_LBL[rate]}</button>
      </div>
    </div>
  );
}

function Headphones({ size = 24, stroke = 'currentColor' }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
      <rect x="3.2" y="13.4" width="4.4" height="7" rx="2" />
      <rect x="16.4" y="13.4" width="4.4" height="7" rx="2" />
    </svg>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: No errors. If `Button` isn't exported from `../../components`, check `src/components/index.ts` — it must include `export { Button } from './Button';` (it already does per the current barrel).

- [ ] **Step 3: Commit**

```bash
git add src/features/konferencja/Player.tsx
git commit -m "Add KonferencjaPlayer detail screen (hero + waveform player + transcript)"
```

---

### Task 7: `KonferencjaScreen` list screen + routing

**Files:**
- Modify: `src/features/konferencja/index.tsx` (replace entire content — currently the old text-only detail screen)
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `api.getKonferencje`/`konferencjaNr` (Task 2), `KonferencjaCard` (Task 5), `KonferencjaPlayer` (Task 6), `Header`/`Loader` from `../../components`.
- Produces: `KonferencjaScreen` (list) exported from `src/features/konferencja/index.tsx`, wired into `/konferencja` and `/konferencja/:nr` routes.

- [ ] **Step 1: Replace `src/features/konferencja/index.tsx`**

Replace the entire file content with:

```tsx
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header, Loader } from '../../components';
import { KonferencjaCard } from './KonferencjaCard';
import { api, konferencjaNr } from '../../data/api';

export function KonferencjaScreen() {
  const nav = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['konferencje'],
    queryFn: () => api.getKonferencje(),
  });
  const lista = data ?? [];

  return (
    <>
      <Header title="Konferencje" />
      <div className="viewport scroll">
        <div className="stage" style={{ paddingTop: 'var(--s4)' }}>
          <div className="eyebrow eyebrow--wine" style={{ marginBottom: 'var(--s2)' }}>Słowo na drogę</div>
          <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, margin: '0 0 var(--s5)' }}>
            Codzienna konferencja w formie nagrania. Słuchaj w drodze, a tekst przeczytasz w dowolnej chwili — także bez zasięgu.
          </p>

          {isLoading ? (
            <Loader />
          ) : (
            <div className="stack stack--lg">
              {lista.map((k) => (
                <KonferencjaCard key={k.id} k={k} onOpen={() => nav(`/konferencja/${konferencjaNr(k.id)}`)} />
              ))}
            </div>
          )}

          <div className="center" style={{ marginTop: 'var(--s6)' }}>
            <span className="localnote">Nagrania i teksty zapisane na telefonie</span>
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Update `src/app/App.tsx`**

Change the import line:

```ts
import { KonferencjaScreen } from '../features/konferencja';
```

to:

```ts
import { KonferencjaScreen } from '../features/konferencja';
import { KonferencjaPlayer } from '../features/konferencja/Player';
```

Change the route:

```tsx
              <Route path="konferencja/:nr" element={<KonferencjaScreen />} />
```

to:

```tsx
              <Route path="konferencja" element={<KonferencjaScreen />} />
              <Route path="konferencja/:nr" element={<KonferencjaPlayer />} />
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -b --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/konferencja/index.tsx src/app/App.tsx
git commit -m "Add konferencje list screen and wire /konferencja routes"
```

---

### Task 8: PWA offline caching for audio + transcripts

**Files:**
- Modify: `vite.config.ts`

**Interfaces:**
- None (build config only).

- [ ] **Step 1: Add runtime caching entries to `vite.config.ts`**

In the `runtimeCaching` array, after the `api-days` entry (`urlPattern: /\/api\/pilgrimages\/\d+\/days\/\d+$/`), add:

```ts
          {
            urlPattern: /\/api\/konferencje(\/[\w-]+)?$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'api-konferencje', expiration: { maxAgeSeconds: 300 } },
          },
          {
            urlPattern: ({ request }) => request.destination === 'audio',
            handler: 'CacheFirst',
            options: {
              cacheName: 'konferencje-audio',
              expiration: { maxEntries: 60, maxAgeSeconds: 31536000 },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\.(?:srt|txt)$/,
            handler: 'CacheFirst',
            options: { cacheName: 'konferencje-transkrypcje', expiration: { maxEntries: 60, maxAgeSeconds: 31536000 } },
          },
```

- [ ] **Step 2: Verify the build picks up the config without errors**

Run: `npm run build`
Expected: Build succeeds (no workbox config validation errors).

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "Add offline caching for conference audio and transcripts"
```

---

### Task 9: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`
Expected: All tests PASS, including the new `src/lib/srt-txt.test.ts` and `src/data/api.test.ts`.

- [ ] **Step 2: Run a full production build**

Run: `npm run build`
Expected: Succeeds with no TypeScript or build errors.

- [ ] **Step 3: Start the dev server against seed data**

Run: `VITE_USE_SEEDS=true npm run dev`

- [ ] **Step 4: Manually verify the list screen**

Open `/konferencja` in the browser. Expected: "Konferencje" header, intro text, three cards (dzień-01/02/03) each showing a headphones icon, title, and author — no day pill, no progress bar, no "odsłuchane"/"wkrótce" labels.

- [ ] **Step 5: Manually verify the player screen**

Click a card (or open `/konferencja/3` directly). Expected: hero with gradient background, title, author initials; player card with waveform, play/pause/±10s/restart controls, speed cycling button. Click play — since `mp3Url` points to a placeholder path with no real file, the browser will show a decode/network error in the console, but the play/pause icon should still toggle and the transcript below should render fully via `<Prose>`.

- [ ] **Step 6: Manually verify the mini-bar collapse**

Scroll the detail screen down past the transcript header. Expected: the floating back button fades out and a mini playback bar slides in from the top showing the title, a thin progress bar, elapsed time, and the speed button.

- [ ] **Step 7: Manually verify Start/Trasa entry points still work**

Open `/` (Start) and `/trasa`, confirm the "Konferencja dnia" tile/button still navigates to `/konferencja/<day>` without errors.

- [ ] **Step 8: Report results**

If any manual check fails, fix the underlying task and re-run steps 1-2 before re-verifying. Do not mark this task complete until all 7 checks above pass.
