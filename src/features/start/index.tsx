import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePilgrimage } from '../../app/PilgrimageContext';
import { toDzien } from '../../data/api';
import { usePozycja } from '../../lib/usePozycja';
import type { ApiPilgrimage, ApiPilgrimageDay } from '../../data/types';
import { fmt } from '../../lib/format';
import { Icon } from '../../lib/icons';
import { Header, Pill, Progress, Eyebrow, Row } from '../../components';
import { WeatherWidget } from './WeatherWidget';
import { StatusWidget } from './StatusWidget';

export function StartScreen() {
  const { state, settings } = usePilgrimage();
  if (state.status === 'loading') return <p className="muted" style={{ padding: 32 }}>Ładowanie…</p>;
  if (state.status === 'error') return <p className="muted" style={{ padding: 32 }}>{state.message}</p>;
  return <StartLoaded pilgrimage={state.pilgrimage} day={state.day} tryb={settings.tryb} />;
}

function StartLoaded({ pilgrimage, day, tryb }: { pilgrimage: ApiPilgrimage; day: ApiPilgrimageDay; tryb: 'auto' | 'gps' | 'plan' }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const dzien = toDzien(day);
  const pos = usePozycja(dzien, tryb);

  return (
    <>
      <Header
        title="Start"
        scrolled={scrolled}
        right={
          <button className="hdr__btn right" onClick={() => navigate('/ustawienia')} aria-label="Ustawienia">
            <Icon name="settings" />
          </button>
        }
      />
      <div className="viewport scroll" onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 4)}>
        <div className="stage stage--rail">
          <div className="stage__grid">
            <div>
              <div className="hero enter enter-1">
                <div className="hero__img" style={{ height: 230, background: 'var(--paper-sunk)', borderRadius: 'var(--r-card)' }} />
              </div>

              <div className="card enter enter-2" style={{ padding: 'var(--s5)', marginTop: 'var(--s4)' }}>
                <div className="dial__top">
                  <Pill variant="rose">Dzień {day.dayNumber} z {pilgrimage.totalDays}</Pill>
                  <button className="iconbtn" onClick={() => navigate('/trasa')} aria-label="Otwórz trasę">
                    <Icon name="navigation" />
                  </button>
                </div>
                <div className="dial__num" style={{ marginTop: 'var(--s3)' }}>
                  {fmt(pos.doCelu)}<small>km</small>
                </div>
                <Eyebrow wine style={{ marginTop: 2 }}>do celu dnia</Eyebrow>
                <div className="dial__route" style={{ marginTop: 'var(--s4)' }}>
                  {dzien.od}<span className="arrow">→</span>{dzien.do}
                </div>
                <div style={{ marginTop: 'var(--s4)' }}>
                  <Progress
                    pct={pos.pct}
                    leftLabel={fmt(pos.km) + ' km przebyto'}
                    rightLabel={fmt(pos.doCelu) + ' km do celu'}
                  />
                </div>
                {pos.zrodlo === 'plan' && (
                  <div className="alert alert--info" style={{ marginTop: 'var(--s3)' }}>
                    <Icon name="locate" className="alert__ic" />
                    <span className="alert__txt">GPS wyłączony — pozycja według harmonogramu</span>
                  </div>
                )}
              </div>

              <div className="stack mt4">
                <div className="enter enter-3">
                  <Row icon="alert" tone="rose" title="Komentarz kwatermistrza"
                    meta={'Dzień ' + day.dayNumber}
                    onClick={() => navigate('/kwatermistrz')} />
                </div>
                <div className="enter enter-4">
                  <Row icon="book" tone="rose" title="Konferencja dnia"
                    meta={day.conference?.title ?? 'Zostanie dodana przed etapem'}
                    onClick={() => navigate('/konferencja/1')} />
                </div>
              </div>

              <div className="only-mobile mt4">
                <WeatherWidget day={day} />
              </div>
            </div>

            <aside className="rail hide-mobile">
              <WeatherWidget day={day} />
              <StatusWidget zrodlo={pos.zrodlo} />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
