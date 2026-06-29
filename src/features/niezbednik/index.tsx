import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Eyebrow, Row, SectionHead } from '../../components';
import { Icon } from '../../lib/icons';

const TILES = [
  { id: 'spiewnik', nazwa: 'Śpiewnik', sub: 'Pieśni na drogę', ic: 'music', kolor: 'rose' },
  { id: 'czytania', nazwa: 'Czytania', sub: 'Liturgia dnia', ic: 'book-open', kolor: 'amber' },
  { id: 'modlitewnik', nazwa: 'Modlitewnik', sub: 'Modlitwy pątnika', ic: 'book-heart', kolor: 'green' },
  { id: 'brewiarz', nazwa: 'Brewiarz', sub: 'Liturgia godzin', ic: 'church', kolor: 'blue' },
] as const;

export function NiezbednikScreen() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  return (
    <>
      <Header title="Niezbędnik" scrolled={scrolled} />
      <div className="viewport scroll" onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 4)}>
        <div className="stage">
          <Eyebrow className="enter enter-1" style={{ marginBottom: 'var(--s3)' }}>Na drogę i do modlitwy</Eyebrow>
          <div className="tiles enter enter-1">
            {TILES.map((k) => (
              <button key={k.id} className="tile" onClick={() => navigate('/niezbednik/' + k.id)}>
                <span className={'tile__ic chip--' + k.kolor}><Icon name={k.ic} /></span>
                <span style={{ marginTop: 'auto' }}>
                  <span className="tile__name" style={{ display: 'block' }}>{k.nazwa}</span>
                  <span className="tile__sub">{k.sub}</span>
                </span>
              </button>
            ))}
          </div>

          <SectionHead>Polecane dziś</SectionHead>
          <div className="enter enter-2">
            <Row icon="music" tone="rose" title="Pieśń pielgrzyma"
              meta="Pieśń pielgrzymkowa na Jasną Górę"
              onClick={() => navigate('/niezbednik/spiewnik')} />
          </div>

          <div className="center mt6">
            <span className="localnote"><Icon name="check" />Teksty dostępne bez zasięgu</span>
          </div>
        </div>
      </div>
    </>
  );
}
