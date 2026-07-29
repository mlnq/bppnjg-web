import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Header, Loader } from '../../components';
import { KonferencjaCard } from './KonferencjaCard';
import { api } from '../../data/api';

export function KonferencjaScreen() {
  const nav = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['konferencje'],
    queryFn: () => api.getKonferencje(),
  });
  const lista = data ?? [];

  return (
    <>
      <Header title="Konferencje" />
      <div className="viewport scroll">
        <div className="stage" style={{ paddingTop: 'var(--s4)' }}>
          <div className="eyebrow eyebrow--wine" style={{ marginBottom: 'var(--s2)' }}>Słowo na drogę</div>
          <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, margin: '0 0 var(--s5)' }}>
            Codzienna konferencja w formie nagrania. Słuchaj w drodze, a tekst przeczytasz w dowolnej chwili — także bez zasięgu.
          </p>

          {isLoading ? (
            <Loader />
          ) : (
            <div className="stack stack--lg">
              {lista.map((k) => (
                <KonferencjaCard key={k.id} k={k} onOpen={() => nav(`/konferencja/${k.id}`)} />
              ))}
            </div>
          )}

          <div className="center" style={{ marginTop: 'var(--s6)' }}>
            <span className="localnote">Nagrania i teksty zapisane na telefonie</span>
          </div>
        </div>
      </div>
    </>
  );
}
