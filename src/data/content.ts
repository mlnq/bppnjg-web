import type { ContentModule } from './types';

export const CONTENT_MAP: Record<string, ContentModule> = {
  modlitewnik: {
    modul: 'Modlitewnik', kolor: 'green', ic: 'book-heart',
    tytul: 'Modlitwa pielgrzyma na drogę',
    sub: 'do odmówienia przed wymarszem',
    akapity: [
      { typ: 'lead', t: 'Boże, Ty wezwałeś Abrahama, aby wyszedł z ziemi swojej, i prowadziłeś lud Twój przez pustynię do ziemi obiecanej.' },
      { typ: 'p', t: 'Bądź dziś przy nas, gdy ruszamy w drogę. Umocnij nogi zmęczone, rozjaśnij myśli niespokojne, otwórz serce na tych, którzy idą obok.' },
      { typ: 'verse', t: '„Prowadź nas, Panie, drogą Twoich przykazań, abyśmy doszli tam, dokąd Ty sam idziesz przed nami."' },
      { typ: 'resp', t: 'W: Strzeż nas w drodze. O: I doprowadź do celu.' },
      { typ: 'p', t: 'Maryjo, Pani Jasnogórska, Przewodniczko pielgrzymów, weź w opiekę każdy nasz krok.' },
      { typ: 'p', t: 'Amen.' },
    ],
  },
  czytania: {
    modul: 'Czytania', kolor: 'amber', ic: 'book-open',
    tytul: 'Liturgia słowa',
    sub: 'wtorek, dzień powszedni',
    akapity: [
      { typ: 'h3', t: 'Pierwsze czytanie · Dz 11, 19–26' },
      { typ: 'p', t: 'W owych dniach ci, których rozproszyło prześladowanie, jakie wybuchło z powodu Szczepana, dotarli aż do Fenicji, na Cypr i do Antiochii, głosząc słowo.' },
      { typ: 'h3', t: 'Psalm responsoryjny' },
      { typ: 'resp', t: 'R: Wielbcie Pana, wszystkie ludy ziemi.' },
      { typ: 'h3', t: 'Ewangelia · J 10, 22–30' },
      { typ: 'p', t: 'Jezus przechadzał się w świątyni, w portyku Salomona.' },
      { typ: 'verse', t: '„Moje owce słuchają mego głosu, a Ja znam je. Idą one za Mną."' },
    ],
  },
  spiewnik: {
    modul: 'Śpiewnik', kolor: 'rose', ic: 'music',
    tytul: 'Pieśń pielgrzyma',
    sub: 'Pieśń pielgrzymkowa na Jasną Górę',
    akapity: [
      { typ: 'p', t: 'Idzie pielgrzym przez tę ziemię, w sercu niosąc Twoje imię, Matko z Jasnej Góry.' },
      { typ: 'resp', t: 'Ref: Prowadź nas, Maryjo, drogą prostą do Twego Syna.' },
      { typ: 'p', t: 'Choć daleka droga przed nami, choć słońce praży, choć deszcz pada — z pieśnią lżej idzie się naprzód.' },
      { typ: 'resp', t: 'Ref: Prowadź nas, Maryjo, drogą prostą do Twego Syna.' },
    ],
  },
  brewiarz: {
    modul: 'Brewiarz', kolor: 'blue', ic: 'church',
    tytul: 'Jutrznia',
    sub: 'Liturgia godzin — modlitwa poranna',
    akapity: [
      { typ: 'p', t: 'Panie, otwórz wargi moje, a usta moje będą głosić Twoją chwałę.' },
      { typ: 'h3', t: 'Hymn' },
      { typ: 'p', t: 'Kiedy ranne wstają zorze, Tobie ziemia, Tobie morze, Tobie śpiewa żywioł wszelki: bądź pochwalon, Boże wielki.' },
      { typ: 'h3', t: 'Psalm 63' },
      { typ: 'verse', t: 'Boże, Ty Boże mój, Ciebie szukam; Ciebie pragnie moja dusza, za Tobą tęskni moje ciało.' },
    ],
  },
};
