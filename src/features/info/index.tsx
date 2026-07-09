import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../data/api';
import { Eyebrow, Loader, SectionHead } from '../../components';
import { Icon } from '../../lib/icons';
import { NoticeCard } from './NoticeCard';
import type { NewsItem } from '../../data/types';

function mapCategory(raw: string): NewsItem['category'] {
  if (raw === 'announcement' || raw === 'logistics' || raw === 'spiritual' || raw === 'weather') return raw;
  return 'announcement';
}

export function InfoScreen() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.getNews(),
    refetchInterval: 2 * 60 * 1000,
  });

  const items: NewsItem[] = (data?.items ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    summary: i.summary || i.content || '',
    category: mapCategory(i.category),
    publishedAt: i.publishedAt,
    isPinned: i.isPinned,
  }));
  const pinned = items.filter((n) => n.isPinned);
  const rest = items.filter((n) => !n.isPinned);

  return (
    <div className="viewport scroll">
      <div className="stage">
          {isLoading ? (
            <Loader />
          ) : (
            <>
          <Eyebrow className="enter enter-1" style={{ marginBottom: 'var(--s2)' }}>Komunikaty z trasy</Eyebrow>
          <div className="stack--lg stack enter enter-1">
            {pinned.map((n) => <NoticeCard key={n.id} item={n} onClick={() => navigate('/info/' + n.id)} />)}
          </div>
          <SectionHead>Historia powiadomień</SectionHead>
          <div className="stack--lg stack enter enter-2">
            {rest.map((n) => <NoticeCard key={n.id} item={n} onClick={() => navigate('/info/' + n.id)} />)}
          </div>
          <div className="center mt6">
            <span className="localnote"><Icon name="check" />Wszystkie komunikaty dostępne offline</span>
          </div>
            </>
          )}
      </div>
    </div>
  );
}
