# Konferencje audio — API gotowe do użycia (bppnjg-web)

Backend jest wdrożony i zweryfikowany. Poniżej dokładny, aktualny kształt
API — zgodny z `APP_API_HANDOFF.md`, plus dodatkowy endpoint `dzisiaj`.

## Base URL

```
https://pilgrimage-admin.bppnjg.workers.dev
```

Wszystkie poniższe endpointy są **publiczne** — brak nagłówków, brak tokenu,
zwykły `fetch`.

## GET /api/konferencje

Lista wszystkich aktywnych konferencji:

```json
[]
```

Stan produkcyjny w chwili pisania tego dokumentu: **lista jest pusta** —
administrator nie wgrał jeszcze żadnej prawdziwej konferencji. To oczekiwane
i poprawne (endpoint zwraca `200` z pustą tablicą, nie błąd). Gdy pojawi się
realna zawartość, każdy element ma dokładnie ten kształt (zweryfikowane na
produkcji na tymczasowym rekordzie testowym, później zarchiwizowanym):

```json
[{ "id": "test", "tytul": "Test", "autor": "Michał" }]
```

## GET /api/konferencje/:id

Szczegół jednej konferencji (realna odpowiedź z produkcji, dla tymczasowego
rekordu testowego `test`, utworzonego i natychmiast zarchiwizowanego wyłącznie
w celu potwierdzenia kształtu odpowiedzi):

```json
{
  "id": "test",
  "tytul": "Test",
  "autor": "Michał",
  "mp3Url": "https://pub-28954ac4a77444e580992b2847354a5f.r2.dev/audio/test.mp3",
  "srtUrl": "https://pub-28954ac4a77444e580992b2847354a5f.r2.dev/transkrypcje/test.srt"
}
```

`404` z `{ "error": { "code": "NOT_FOUND", "message": "..." } }`, gdy `id` nie
istnieje lub jest zarchiwizowane.

## GET /api/konferencje/dzisiaj

Zwraca konferencję przypisaną do aktywnego dnia pielgrzymki (ten sam kształt
co `/:id`). `404` z `{ "error": { "code": "NOT_FOUND", "message": "Brak
konferencji przypisanej do dzisiejszego dnia." } }`, jeśli żadna konferencja
nie jest dziś przypisana — obsłuż ten przypadek w UI (np. pokaż listę
wszystkich konferencji zamiast odtwarzacza).

Realna odpowiedź z produkcji w chwili pisania (żadna konferencja nie jest
obecnie przypisana do dzisiejszego dnia):

```json
{ "error": { "code": "NOT_FOUND", "message": "Brak konferencji przypisanej do dzisiejszego dnia." } }
```

## Gotowy `api.ts`

```ts
const API_BASE = "https://pilgrimage-admin.bppnjg.workers.dev"

export type Konferencja = {
  id: string
  tytul: string
  autor: string
}

export type KonferencjaSzczegol = Konferencja & {
  mp3Url: string
  srtUrl: string
}

export async function getKonferencje(): Promise<Konferencja[]> {
  const res = await fetch(`${API_BASE}/api/konferencje`)
  if (!res.ok) throw new Error("Nie udało się pobrać listy konferencji")
  return res.json()
}

export async function getKonferencja(id: string): Promise<KonferencjaSzczegol> {
  const res = await fetch(`${API_BASE}/api/konferencje/${id}`)
  if (!res.ok) throw new Error("Nie udało się pobrać konferencji")
  return res.json()
}

export async function getDzisiejszaKonferencja(): Promise<KonferencjaSzczegol | null> {
  const res = await fetch(`${API_BASE}/api/konferencje/dzisiaj`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error("Nie udało się pobrać dzisiejszej konferencji")
  return res.json()
}
```

Transkrypcję (`srtUrl`) parsuj istniejącym `srtNaAkapity`/`txtNaAkapity` z
`srt-txt.ts` w tym samym katalogu handoffu — bez zmian względem oryginalnej
paczki.

## Checklist integracji

- [x] `curl <base>/api/konferencje` zwraca `200` i tablicę JSON (może być pusta) — zweryfikowane na produkcji 2026-07-18: zwraca `200 []` (patrz wyżej)
- [x] `curl <base>/api/konferencje/<realny-id-z-listy>` zwraca `200` z `mp3Url`/`srtUrl` — zweryfikowane na produkcji 2026-07-18 na tymczasowym rekordzie testowym (patrz przykład wyżej), później zarchiwizowanym
- [ ] Odtworzenie `mp3Url` bezpośrednio w przeglądarce/`<audio>` działa (plik jest publicznie dostępny) — **nie zweryfikowane w tym kroku** (rekord testowy zawierał kilka KB dowolnych bajtów, nie prawdziwe audio; zweryfikuj ponownie, gdy administrator wgra pierwszą realną konferencję)
- [x] `curl <base>/api/konferencje/dzisiaj` zwraca `200` (jeśli dziś jest przypisana konferencja) albo `404` (jeśli nie) — obsłuż oba przypadki w UI — zweryfikowane na produkcji 2026-07-18: zwraca `404` (patrz wyżej)

Powyższe znaczniki odzwierciedlają weryfikację wykonaną podczas przygotowania
tego dokumentu (17-18.07.2026). Mimo to **zweryfikuj ponownie samodzielnie**
przy integracji — stan produkcji (zawartość listy, przypisania do dni) może
się zmienić w międzyczasie, gdy administrator zacznie wgrywać realne
konferencje.
