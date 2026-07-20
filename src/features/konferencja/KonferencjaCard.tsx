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
