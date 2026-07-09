import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../data/api';
import { Reader, Pill } from '../../components';
import type { NewsItem } from '../../data/types';

function mapCategory(raw: string): NewsItem['category'] {
  if (raw === 'announcement' || raw === 'logistics' || raw === 'spiritual' || raw === 'weather') return raw;
  return 'announcement';
}

const CAT_ICON: Record<string, string> = {
  announcement: 'message', logistics: 'alert', spiritual: 'cross', weather: 'cloud-sun',
};

export function InfoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['news'], queryFn: () => api.getNews() });
  const raw = (data?.items ?? []).find((i) => i.id === id);
  if (isLoading) {
    return (
      <Reader
        title="Komunikat"
        onBack={() => navigate(-1)}
        kickerIcon="message"
        kickerLabel="Ładowanie"
        headline="Komunikat"
        akapity={[]}
        loading
      />
    );
  }
  if (!raw) return null;

  const cat = mapCategory(raw.category);
  const date = new Date(raw.publishedAt).toLocaleString('pl-PL', {
    hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
  });

  const akapity = [
    { typ: 'lead' as const, t: raw.summary },
    ...(raw.content && raw.content !== raw.summary ? [{ typ: 'p' as const, t: raw.content }] : []),
  ];

  return (
    <Reader
      title="Komunikat"
      onBack={() => navigate(-1)}
      kickerIcon={CAT_ICON[cat] ?? 'message'}
      kickerLabel={date}
      headline={raw.title}
      byline={raw.isPinned ? <div className="reader__byline"><Pill variant="rose" icon="pin">Przypięte</Pill></div> : null}
      akapity={akapity}
    />
  );
}
