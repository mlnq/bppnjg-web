# Moduł Konferencje: odtwarzacz MP3 + transkrypcja

Data: 2026-07-15
Status: zatwierdzony do implementacji

## Kontekst

Aplikacja Pielgrzym ma dziś tylko tekstowy ekran "Konferencja dnia"
(`src/features/konferencja/index.tsx`), zasilany polem `day.conference`
z bootstrap API (`title`, `author`, `content`). Handoff w
`design_handoff_konferencje/` (skopiowany też do katalogu projektu) rozszerza
to o nagranie MP3 z odtwarzaczem oraz transkrypcję do czytania, w wariancie
hi-fi "Słuchowisko" (duże hero, odtwarzacz zwijający się w mini-pasek po
przewinięciu).

Handoff zawiera dwa niespójne kontrakty danych:
- `README.md` / `types.ts.txt` / `konferencje.seed.json.txt` — bogaty model
  (`nr, dzien, dataLbl, autor, funkcja, stan, dlugosc, peaks, akapity`),
- `APP_API_HANDOFF.md` — świadomie uproszczona wersja API
  (`id, tytul, autor, mp3Url, srtUrl`), bez `dzien/funkcja/stan/peaks`.

Decyzja: **idziemy za uproszczonym API**, UI listy tracimy pigułkę "Dzień N",
podtytuł funkcji autora oraz stany odsłuchane/w toku/wkrótce — bo prosty
kontrakt nie dostarcza tych danych, a fałszywe odtwarzanie ich wyłącznie z
`localStorage` rozjeżdżałoby się między urządzeniami.

## Routing i identyfikacja konferencji

Trasa zostaje **numeryczna i niezmieniona względem dziś**:
`/konferencja/:nr` gdzie `nr` = numer dnia pielgrzymki (jak obecnie).
Wejścia z ekranu Start i Trasa (`navigate('/konferencja/' + day.dayNumber)`)
pozostają bez zmian.

Backendowe API adresuje konferencje sluggiem tekstowym (`"dzien-03"`), więc w
warstwie danych dokładamy adapter:

```ts
const konferencjaId = (nr: number) => `dzien-${String(nr).padStart(2, '0')}`;
```

Lista (`GET /api/konferencje`) zwraca `id` w tym samym formacie — ekran listy
odczytuje z niego `nr` (`/dzien-(\d+)/`) żeby zbudować link `/konferencja/:nr`.

## Model danych

Dopisać do `src/data/types.ts`:

```ts
export type Konferencja = {
  id: string;          // np. "dzien-03"
  tytul: string;
  autor: string;
  mp3Url: string;
  srtUrl: string;
  akapity?: Akapit[];  // dogenerowane po fetchu+parsie SRT, brak w odpowiedzi listy
};
```

## Warstwa danych (`src/data/api.ts`)

Dopisać do istniejącego obiektu `api`, wg tego samego wzorca co
`bootstrap/getNews/getQuartermaster` (przełącznik `USE_SEEDS`):

```ts
getKonferencje(): Promise<Konferencja[]>
getKonferencja(nr: number): Promise<Konferencja>   // parsuje srtUrl -> akapity
```

Seed: nowy `src/data/seeds/konferencje.json` w uproszczonym kształcie (3-4
przykładowe wpisy z `akapity` wpisanymi wprost w seedzie, żeby dev bez
backendu miał od razu tekst do czytania — parser SRT używany tylko w trybie
realnego fetcha).

## Nowe pliki

- `src/lib/useAudioKonferencja.ts` — kopia z `useAudioKonferencja.ts.txt` bez
  zmian (mechanika `<audio>`: play/pauza/seek/skip/prędkość/wznowienie przez
  `localStorage` pod kluczem `pg.konf.<nr>`).
- `src/lib/srt-txt.ts` — kopia z `srt-txt.ts.txt` bez zmian
  (`srtNaAkapity`/`txtNaAkapity`).
- `src/features/konferencja/KonferencjaScreen.tsx` — ekran szczegółu
  (przeniesiona logika z dzisiejszego `index.tsx`, zastąpiona wariantem
  "Słuchowisko" z `KonferencjaScreen.tsx.txt`: hero, waveform, transport,
  mini-pasek po przewinięciu, transkrypcja przez `<Prose>`).
- `src/features/konferencja/KonferencjaCard.tsx` — kafel listy, **okrojony**:
  ikona słuchawek (jednolity gradient burgundu, bez wariantów kolorystycznych
  per-stan), tytuł, autor. Bez pigułki dnia, bez paska postępu, bez etykiet
  odsłuchane/wkrótce.
- `src/features/konferencja/index.tsx` — staje się `KonferencjaListaScreen`
  (dzisiejsza zawartość tego pliku przenosi się do `KonferencjaScreen.tsx`).

## Style

Dopisać `konferencja.css.txt` do `src/styles/base.css` bez zmian — korzysta
wyłącznie z istniejących tokenów (`--wine`, `--rose`, spacing, promienie,
cienie), więc nie wymaga nowych zmiennych. Jedyna korekta: usunąć/nie kopiować
reguł `.konf-card__cover--soon/--done` i `.konf-card__lbl--*`, które
odpowiadały za stany usunięte z UI listy.

## Routing w `App.tsx`

```tsx
<Route path="konferencja" element={<KonferencjaListaScreen/>} />
<Route path="konferencja/:nr" element={<KonferencjaScreen/>} />
```

## Obsługa braku danych

Jeśli dany dzień nie ma jeszcze konferencji (404 z API), ekran szczegółu
pokazuje prosty komunikat "Konferencja pojawi się przed etapem" — bez
osobnego systemu stanów wizualnych (spójne z decyzją o okrojeniu UI).

## Offline (PWA)

Dopisać do `vite.config.ts` → `VitePWA.workbox.runtimeCaching`:
- `/api/konferencje` (lista) — `StaleWhileRevalidate`.
- pliki audio/transkrypcji (R2 public base) — `CacheFirst`,
  `rangeRequests: true` (odtwarzacz `<audio>` wysyła żądania Range).

## Testy

Bez testów UI dla samego odtwarzacza (spójne z resztą projektu — pozostałe
ekrany też nie mają testów komponentów). Dodać testy jednostkowe dla czystych
funkcji `srtNaAkapity`/`txtNaAkapity` w `src/lib/srt-txt.test.ts`, analogicznie
do istniejącego `src/lib/position.test.ts`.

## Poza zakresem tego etapu

Panel administratora do wgrywania plików (`ADMIN_R2_HANDOFF.md`) — backend nie
istnieje jeszcze; instrukcja ręcznego wgrywania MP3/SRT do Cloudflare R2
zostanie przygotowana osobno po zbudowaniu tego modułu.
