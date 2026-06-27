import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../data/api';
import { Header, Pill } from '../../components';

export function KwatermistrzScreen() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const { data } = useQuery({
    queryKey: ['quartermaster'],
    queryFn: () => api.getQuartermaster(),
    refetchInterval: 2 * 60 * 1000,
  });
  const items = data?.items ?? [];

  return (
    <>
      <Header title="Kwatermistrz" scrolled={scrolled} />
      <div className="viewport scroll" onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 4)}>
        <div className="stage">
          <p className="muted enter enter-1" style={{ fontSize: 15, lineHeight: 1.55, margin: '0 0 var(--s5)' }}>
            Wieczorne podsumowania dnia — nocleg, kuchnia, sprawy organizacyjne.
          </p>
          <div className="stack--lg stack">
            {items.map((e, i) => {
              const date = new Date(e.publishedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
              const preview = e.content.split('\n')[0] ?? '';
              return (
                <button key={e.id} className={'notice enter enter-' + Math.min(i + 1, 4)}
                  onClick={() => navigate('/kwatermistrz/' + e.id)}
                  style={{ textAlign: 'left', display: 'block', width: '100%' }}>
                  <div className="notice__top">
                    {e.dayNumber != null && <Pill variant="ghost">Dzień {e.dayNumber}</Pill>}
                    <span className="notice__time">{date}</span>
                  </div>
                  <div className="notice__title">{e.title}</div>
                  <div className="notice__excerpt">{preview}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
