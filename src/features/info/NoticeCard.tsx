import { Pill } from '../../components';
import type { NewsItem } from '../../data/types';

const CAT_LABEL: Record<string, string> = {
  announcement: 'Organizacja', logistics: 'Logistyka',
  spiritual: 'Duchowe', weather: 'Pogoda',
};

type Props = { item: NewsItem; onClick: () => void };

export function NoticeCard({ item, onClick }: Props) {
  const date = new Date(item.publishedAt).toLocaleString('pl-PL', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
  return (
    <button
      className={'notice' + (item.isPinned ? ' notice--pinned' : '')}
      onClick={onClick}
      style={{ textAlign: 'left', display: 'block', width: '100%' }}
    >
      <div className="notice__top">
        {item.isPinned && <Pill variant="rose" icon="pin">Przypięte</Pill>}
        <span className="eyebrow">{CAT_LABEL[item.category] ?? item.category}</span>
        <span className="notice__time">{date}</span>
      </div>
      <div className="notice__title">{item.title}</div>
      <div className="notice__excerpt">{item.summary}</div>
    </button>
  );
}
