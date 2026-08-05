/** Tryb używany przez hook obliczający pozycję. */
export type TrybPozycji = 'auto' | 'gps' | 'plan';

/**
 * Publiczna nazwa flagi konfigurowanej w panelu administracyjnym.
 * `hybrid` oznacza GPS z fallbackiem do harmonogramu.
 */
export type DomyslnyTrybPozycji = 'schedule' | 'hybrid';

export const DOMYSLNY_TRYB_POZYCJI: DomyslnyTrybPozycji = 'schedule';

export function trybZFlagiPozycji(tryb: DomyslnyTrybPozycji | undefined): TrybPozycji {
  switch (tryb ?? DOMYSLNY_TRYB_POZYCJI) {
    case 'hybrid': return 'auto';
    case 'schedule': return 'plan';
  }
}
