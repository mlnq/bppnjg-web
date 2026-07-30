# API dla aplikacji web — moduł Konferencje (wersja prosta)

Dane konferencji ograniczone do czterech pól: **tytuł, nagranie (MP3), autor, SRT**.
Bez dodatkowych metadanych (bez `dzien`, `funkcja`, `stan`, `peaks` itd.) — jeśli
kiedyś będą potrzebne, dopisujemy, na razie zbędne.

## Model danych
```json
{
  "id": "dzien-03",
  "tytul": "Iść w rytmie, który nie jest twój",
  "autor": "ks. Tomasz Wadowski",
  "mp3Url": "https://<r2-public-base>/audio/dzien-03.mp3",
  "srtUrl": "https://<r2-public-base>/transkrypcje/dzien-03.srt"
}
```
- `id` — dowolny unikalny slug (np. nazwa dnia), używany w URL.
- `mp3Url`, `srtUrl` — pełne, publiczne linki do plików w R2.

## GET /api/konferencje
Lista wszystkich konferencji (do ekranu listy):
```json
[
  { "id": "dzien-03", "tytul": "Iść w rytmie, który nie jest twój", "autor": "ks. Tomasz Wadowski" },
  { "id": "dzien-02", "tytul": "Pierwszy krok należy do Boga", "autor": "ks. Andrzej Lemann" }
]
```

## GET /api/konferencje/:id
Szczegół jednej konferencji (odtwarzacz + transkrypcja):
```json
{
  "id": "dzien-03",
  "tytul": "Iść w rytmie, który nie jest twój",
  "autor": "ks. Tomasz Wadowski",
  "mp3Url": "https://<r2-public-base>/audio/dzien-03.mp3",
  "srtUrl": "https://<r2-public-base>/transkrypcje/dzien-03.srt"
}
```
`404`, gdy `id` nie istnieje.

## Frontend
```ts
export async function getKonferencje() {
  return fetch('/api/konferencje').then(r => r.json());
}
export async function getKonferencja(id: string) {
  const k = await fetch(`/api/konferencje/${id}`).then(r => r.json());
  const srt = await fetch(k.srtUrl).then(r => r.text());
  return { ...k, akapity: srtNaAkapity(srt) };
}
```
Długość nagrania i pozycja bieżąca czytane wprost z `<audio>` (`duration`,
`currentTime`) — nie trzeba ich trzymać w danych.

## Backend (przypomnienie z ADMIN_R2_HANDOFF.md)
- D1/KV trzyma tylko wiersz `{ id, tytul, autor, mp3Key, srtKey }`.
- Pliki (`.mp3`, `.srt`) leżą w R2; endpoint doklaja `R2_PUBLIC_BASE` do kluczy
  i zwraca gotowe URL-e jak wyżej.
- Admin przy dodawaniu konferencji wpisuje tytuł + autora i wgrywa dwa pliki
  (MP3 + SRT) — nic więcej.
