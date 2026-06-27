import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../data/api';
import { Reader } from '../../components';
import { Icon } from '../../lib/icons';

export function KwatermistrzEntry() {
  const { nr } = useParams<{ nr: string }>();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['quartermaster'], queryFn: () => api.getQuartermaster() });
  const entry = (data?.items ?? []).find((e) => e.id === nr) ?? data?.items?.[0];
  if (!entry) return null;

  const date = new Date(entry.publishedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
  const paragraphs = entry.content.split('\n').filter(Boolean).map((t) => ({ typ: 'p' as const, t }));

  return (
    <Reader
      title="Kwatermistrz"
      onBack={() => navigate(-1)}
      kickerIcon="alert"
      kickerLabel={'Komentarz dnia · ' + date}
      headline={entry.title}
      byline={
        <div className="reader__byline">
          <Icon name="bed" />
          <span>{paragraphs[0]?.t ?? ''}</span>
        </div>
      }
      akapity={paragraphs.slice(1)}
    />
  );
}
