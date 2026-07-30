# Handoff: Panel administratora — nagrania konferencji (Cloudflare R2 + D1/KV)

## Cel
Admin dodaje konferencję dnia: **plik audio (MP3)** + **transkrypcję (SRT lub TXT)**.
Dziś baza (D1/KV) trzyma tylko tekst — pliki binarne (audio) tam nie trafiają.
Rozwiązanie: pliki lądują w **Cloudflare R2** (obiektowy storage, zero egress,
darmowe 10GB/mies.), baza trzyma tylko **metadane + klucz pliku w R2**.

## Struktura danych (D1/KV — bez zmian w silniku, tylko nowe pola)
Tabela/rekord `konferencje`:
```
nr int, dzien int, dataLbl text, tytul text, autor text, funkcja text,
stan text ('teraz'|'odsluchane'|'wkrotce'),
dlugosc int (sekundy, z metadanych pliku po uploadzie),
mp3Key text        -- np. "audio/dzien-03.mp3"  (klucz obiektu w R2, NIE plik)
transkryptKey text -- np. "transkrypcje/dzien-03.srt"
```
Baza nigdy nie trzyma bajtów MP3/SRT — tylko te dwa klucze (stringi).

## R2 — bucket na pliki
Utwórz bucket, np. `pielgrzym-konferencje`. Dwa "foldery" (prefiksy klucza):
`audio/` i `transkrypcje/`. Publiczny dostęp do odczytu (albo dev URL / custom
domain) — apka odtwarza plik bezpośrednio z R2, bez pośrednika.

## Flow w panelu admina (co ma się dziać po kliknięciu "Zapisz")
1. Admin wypełnia formularz konferencji (tytuł, autor, dzień, data) i wybiera
   plik `.mp3` + plik `.srt`/`.txt`.
2. Worker/API panelu (endpoint typu `POST /admin/konferencje`):
   - odbiera pliki (multipart/form-data),
   - zapisuje audio do R2 pod kluczem `audio/dzien-{nr}.mp3` (`R2_BUCKET.put(key, plikBinarny)`),
   - zapisuje transkrypcję do R2 pod kluczem `transkrypcje/dzien-{nr}.srt`,
   - liczy `dlugosc` (z metadanych audio, lub podaje ją admin ręcznie),
   - zapisuje rekord do D1/KV z polami tekstowymi + `mp3Key` + `transkryptKey`
     (same klucze, nie zawartość plików).
3. Panel pokazuje listę konferencji z linkiem "odsłuchaj" (podgląd z R2).

## Endpoint dla aplikacji (czytający, dla użytkownika pielgrzyma)
`GET /api/konferencje/:nr`:
- czyta rekord tekstowy z D1/KV,
- dokleja pełny URL do plików: `mp3Url = R2_PUBLIC_BASE + mp3Key`,
  `transkryptUrl = R2_PUBLIC_BASE + transkryptKey`,
- zwraca JSON `{ nr, tytul, autor, dlugosc, mp3Url, transkryptUrl, stan, ... }`.

Aplikacja (moduł Konferencje, patrz wcześniejsza paczka handoffu) woła ten
endpoint, wstawia `mp3Url` w `<audio src>`, a `transkryptUrl` pobiera i parsuje
(`srt-txt.ts` → SRT lub TXT → akapity do czytania). Zero plików binarnych w
kodzie aplikacji ani w repo.

## Podsumowanie podziału odpowiedzialności
- **D1/KV** — tylko tekst: metadane konferencji + dwa klucze do R2.
- **R2** — tylko binaria: pliki `.mp3` i `.srt/.txt`, adresowane kluczem.
- **Worker (admin)** — przyjmuje upload z panelu, zapisuje do R2 + D1.
- **Worker (publiczny API)** — skleja tekst z D1 i URL-e z R2 dla apki.
- **Offline w apce** — opcjonalny cache po stronie klienta (Service Worker),
  R2 zostaje jedynym źródłem prawdy — nic nie jest "na sztywno" w buildzie apki.

Przy małej liczbie nagrań (jak u Ciebie) całość mieści się w darmowym limicie R2
(10GB storage, miliony operacji/mies.) — koszt $0.
