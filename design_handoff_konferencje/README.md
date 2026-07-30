# Handoff: Moduł Konferencje (odtwarzacz MP3 + transkrypcja)

## Overview
Rozszerzenie aplikacji **Pielgrzym**: dotychczasowa „Konferencja dnia" (sam tekst)
zmienia się w **nagranie (domyślnie MP3) z odtwarzaczem** oraz **transkrypcję do
czytania** (z dołączonego pliku **SRT** lub **TXT**). Moduł ma dwa ekrany:
**lista konferencji** (archiwum dni) i **ekran konferencji** (odtwarzacz + tekst).

Wariant zatwierdzony przez klienta: **„Słuchowisko"** — duże hero z nagraniem na
górze; po przewinięciu odtwarzacz zwija się w **górny pasek (mini)**, więc można
**czytać transkrypcję, słuchając w tle**. Pozycja odsłuchu zapisuje się sama.

## About the Design Files
Pliki w katalogu `prototyp/` to **makiety w HTML** (Design Components) — pokazują
docelowy wygląd i zachowanie, **nie są kodem do skopiowania 1:1**. Zadaniem jest
**odtworzyć te ekrany w istniejącym środowisku** aplikacji Pielgrzym (React + TS,
zgodnie z głównym `HANDOFF.md` design systemu), używając jej komponentów i stylów.
Gotowe pliki `.ts/.tsx/.css/.json` w tym katalogu (z rozszerzeniem `.txt`, żeby nie
mieszały się z kodem — przy kopiowaniu zdejmij `.txt`) są **punktem startu**, nie
finalną prawdą; dostosuj importy i ścieżki do swojego repo.

## Fidelity
**Hi-fi.** Kolory, typografia, spacing i interakcje są finalne i pochodzą z tokenów
design systemu (`app.css`). Odwzoruj UI wiernie, korzystając z istniejących
komponentów (`Header`, `Prose`, `Icon`, `pill`, `chip`, `eyebrow`, `localnote`,
`card`, `viewport`, `stage`) — nowe są tylko elementy odtwarzacza (patrz `konferencja.css`).

## Co podmieniasz względem makiety (najważniejsze)
Makieta symuluje dźwięk zegarem. W produkcji wpinasz realny element i dane:

1. **Symulowany zegar → `<audio>`.** Cała mechanika jest w **`useAudioKonferencja.ts`**:
   `toggle`→`play()/pause()`, `skip(±10)`→`currentTime ± 10`, `rate`→`playbackRate`,
   pasek/waveform czyta `currentTime` z `timeupdate`, seek ustawia `currentTime`.
   Wznawianie zapisuje się w `localStorage` pod kluczem `pg.konf.<nr>`.
2. **Dane z API.** Typ **`Konferencja`** w `types.ts` (m.in. `mp3Url`, `dlugosc`,
   `akapity`, opcjonalne `peaks`). Na start statyczny `konferencje.seed.json`,
   docelowo `getKonferencja(nr)` z `api.ts`.
3. **SRT/TXT → `akapity[]`.** Parser w **`srt-txt.ts`** (`srtNaAkapity`, `txtNaAkapity`).
   Transkrypcji **nie synchronizujemy** z dźwiękiem — to tekst do czytania (renderuje
   istniejący `<Prose>` po polach `{typ, t}`).

## Routing
Dodaj dwie trasy (w `App.tsx`/`Shell`):
```tsx
<Route path="konferencja" element={<KonferencjaListaScreen/>} />      // lista (archiwum)
<Route path="konferencja/:nr" element={<KonferencjaScreen/>} />        // odtwarzacz + tekst
```
W makiecie/handoffie istniała już trasa `konferencja/:nr` — rozbij ją na listę + szczegół.
Wejście do modułu: z ekranu Start/Trasa (kafel „Konferencja dnia") prowadź do
`/konferencja/<nr dnia>`, a „Wszystkie konferencje" do `/konferencja`.

## Ekrany / Views

### 1. KonferencjaListaScreen — archiwum
- **Cel:** wybór konferencji (dnia) do odsłuchu/czytania.
- **Layout:** standardowy `Header` „Konferencje" + `viewport.scroll` + `stage`.
  Wstęp (`eyebrow--wine` + akapit `muted`), potem `stack stack--lg` kafli.
- **Kafel (`.konf-card`):** lewa okładka 62×62 z gradientem burgundu i numerem dnia
  + ikoną słuchawek; po prawej: pigułka „Dzień N" (`pill--rose`), data, czas nagrania
  (ikona zegar), tytuł (`font-head` 700/16), autor (13/`ink-2`) oraz wiersz stanu:
  - `teraz` → pasek postępu + „Wznów · m:ss" (`--wine`),
  - `odsluchane` → ✓ „Odsłuchane" (`--green`),
  - `wkrotce` → wyszarzony (opacity .62), nieklikalny, „Dostępna 14 maja".

### 2. KonferencjaScreen — odtwarzacz + transkrypcja (wariant „Słuchowisko")
- **Hero (`.konf-hero`):** gradient `165deg, --wine → --wine-700 → #4d0f24`, biały tekst.
  Eyebrow „Konferencja · Dzień N" (`--rose`), tytuł `font-head` 800/27, wiersz autora
  z inicjałami w kółku. W tle duża słuchawka `opacity .16` + okrągłe halo.
- **Karta odtwarzacza (`.konf-player`, `card`):** wchodzi `margin-top:-44px` na hero.
  - **Waveform (`.konf-wave`):** ~46 słupków `flex` z `justify-content:space-between`
    (rozciągnięte na całą szerokość), wysokość z `peaks`/fallbacku; zapełnione do
    pozycji = `--wine`, reszta = `--paper-sunk`. Cały pasek jest **seekowalny**
    (pointer down/move — także przeciąganie).
  - **Czasy:** elapsed (`--wine`) ↔ total.
  - **Transport (`.konf-controls`):** ⏮ od początku · **−10 s** · ▶/⏸ (66px, burgund) ·
    **+10 s** · pigułka prędkości (`0,75× / 1× / 1,25× / 1,5× / 2×`). Przyciski −10/+10
    to okrągłe strzałki z liczbą „10" w środku.
- **Transkrypcja:** nagłówek `eyebrow--wine` „Transkrypcja nagrania" + `localnote`
  „do czytania", poniżej `<Prose akapity dropcap />`. Stopka `localnote` „Zapisane offline".
- **Przewinięcie:** przy `scrollTop > 180` na `.konf` pojawia się klasa `is-scrolled`:
  pływający przycisk wstecz znika, a z góry **wjeżdża pasek mini** (`.konf-mini`):
  wstecz + mała ▶/⏸ + tytuł + cienki pasek postępu + czas + prędkość. Dzięki temu
  odtwarzanie trwa, a użytkownik czyta tekst. Transitions: mini `transform .26s`
  `cubic-bezier(.22,1,.36,1)`, back `opacity .2s`.

## Interactions & Behavior
- **Play/Pauza** — `toggle()`; ikona zależy od `playing`.
- **−10 / +10 s** — `skip(±10)`, clamp 0..dur.
- **Od początku** — `restart()` → `seek(0)`.
- **Seek** — klik/przeciągnięcie po waveform (szczegół) lub po pasku (mini).
- **Prędkość** — `cycleSpeed()` cyklicznie po `[0.75,1,1.25,1.5,2]`.
- **Wznów** — pozycja z `localStorage` (`pg.konf.<nr>`) wczytywana przy wejściu;
  zapis na każdym `timeupdate`.
- **Mini-bar** — sterowany progiem przewinięcia (180 px).
- Szanuj `prefers-reduced-motion` (jak reszta aplikacji — animacje wejścia opcjonalne).

## State Management
Lokalny stan ekranu szczegółu (w hooku `useAudioKonferencja`): `t`, `dur`, `pct`,
`playing`, `rate` + `ref` do `<audio>`. W komponencie dodatkowo `scrolled` (mini-bar).
Brak globalnego store — dane konferencji z `api.ts`. Offline/PWA jak w głównym
`HANDOFF.md` (cache-first dla pobranych nagrań i tekstów).

## Design Tokens
Wszystkie z `app.css` (nie wymyślaj nowych): burgund `--wine #7C1D3F`,
`--wine-700 #631531`, `--wine-300 #AE5D75`, `--rose #F2D8E0`, `--rose-soft`,
papier `--paper`, `--surface`, `--surface-soft`, `--paper-sunk`, atrament
`--ink/--ink-2/--muted/--faint`, linie `--line/--line-2`, `--green #2E8B5E`.
Promienie `--r-card 22px`, spacing `--s1..--s16`, fonty `--font-head`/`--font-read`,
cienie `--sh-card/--sh-soft/--sh-pop`. Nowe wartości tylko w `konferencja.css`
(gradient hero, cień przycisku play) — wyprowadzone z tych tokenów.

## Assets
- **Ikony:** linia 24×24 (Lucide-like), zgodne z `icons.js` design systemu — słuchawki,
  zegar, chevrony, play/pause (fill), strzałki ±10. W handoffie wpisane inline w SVG.
- **Nagrania:** pliki `.mp3` z `mp3Url` (tu placeholdery `/audio/konferencje/...`).
- **Transkrypcje:** pliki `.srt`/`.txt` parsowane do `akapity[]`.
- **Waveform:** opcjonalne `peaks: number[]` z API; bez nich deterministyczny fallback.

## Files (w tym katalogu — zdejmij `.txt`)
- `types.ts` — typ `Konferencja` + `Akapit`.
- `srt-txt.ts` — `srtNaAkapity` / `txtNaAkapity`.
- `useAudioKonferencja.ts` — hook nad `<audio>` (play/seek/skip/rate/wznów).
- `KonferencjaScreen.tsx` — ekran odtwarzacza + transkrypcji (wariant „Słuchowisko").
- `KonferencjaListaScreen.tsx` — archiwum konferencji.
- `konferencja.css` — nowe klasy `.konf-*` (dopisz do `base.css`).
- `api.ts` — `getKonferencje` / `getKonferencja` (+ wariant z fetch i parserem).
- `konferencje.seed.json` — dane przykładowe.
- `prototyp/` — źródłowe makiety HTML (referencja wizualna; otwórz w przeglądarce
  z dostępem do `_ds/` design systemu).
