import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePilgrimage, selectWindowState, getDaysUntilStart } from '../../app/PilgrimageContext';
import { toDzien } from '../../data/api';
import { usePozycja } from '../../lib/usePozycja';
import type { ApiPilgrimage, ApiPilgrimageDay } from '../../data/types';
import { fmt } from '../../lib/format';
import { Icon } from '../../lib/icons';
import { Header, Pill, Progress, Eyebrow, Row, Loader } from '../../components';
import { WeatherWidget } from './WeatherWidget';
import { StatusWidget } from './StatusWidget';

type StateScreenProps = {
  eyebrow: string;
  metric: string;
  metricLabel: string;
  title: string;
  description: string;
  footer?: string;
  onSettings: () => void;
};

function PilgrimageStateScreen({ eyebrow, metric, metricLabel, title, description, footer, onSettings }: StateScreenProps) {
  return (
    <>
      <Header
        title="Start"
        right={
          <button className="hdr__btn right" onClick={onSettings} aria-label="Ustawienia">
            <Icon name="settings" />
          </button>
        }
      />
      <div className="viewport" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--s5)' }}>
        <div className="card enter enter-1" style={{ maxWidth: 380, width: '100%', padding: 'var(--s6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Eyebrow wine>{eyebrow}</Eyebrow>

          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            border: '6px solid var(--wine)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginTop: 'var(--s5)',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 56, fontWeight: 700, color: 'var(--wine)', lineHeight: 1 }}>
              {metric}
            </span>
          </div>

          <p style={{ color: 'var(--wine)', fontWeight: 700, marginTop: 'var(--s3)', fontSize: 15 }}>{metricLabel}</p>

          <div style={{ width: 48, height: 1, background: 'var(--wine)', opacity: 0.25, margin: 'var(--s4) auto' }} />

          <h2 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.35 }}>{title}</h2>
          <p className="muted" style={{ marginTop: 'var(--s3)', fontSize: 15, lineHeight: 1.7, maxWidth: 300 }}>{description}</p>

          {footer && (
            <div style={{
              marginTop: 'var(--s4)', padding: '8px 20px', borderRadius: 999,
              border: '1.5px solid var(--wine)', color: 'var(--wine)',
              fontSize: 13, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
            }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function StartScreen() {
  const { state, settings } = usePilgrimage();
  const navigate = useNavigate();

  if (state.status === 'loading') return <Loader fullscreen />;
  if (state.status === 'error') return <p className="muted" style={{ padding: 32 }}>{state.message}</p>;

  const windowState = selectWindowState(state.pilgrimage, settings.devDay);
  const YEAR = new Date().getFullYear();
  const onSettings = () => navigate('/ustawienia');

  if (windowState === 'before') {
    const daysLeft = getDaysUntilStart();
    return (
      <PilgrimageStateScreen
        eyebrow={`Pielgrzymka ${YEAR}`}
        metric={String(daysLeft)}
        metricLabel={daysLeft === 1 ? 'dzień do wyjścia' : 'dni do wyjścia'}
        title="Już niedługo ruszamy"
        description="Przygotuj się na wspólną drogę. Aktualna trasa, pogoda i najważniejsze informacje pojawią się tutaj w dniu rozpoczęcia."
        footer="Startujemy 30 lipca"
        onSettings={onSettings}
      />
    );
  }

  if (windowState === 'after') {
    return (
      <PilgrimageStateScreen
        eyebrow={`Pielgrzymka ${YEAR}`}
        metric="✓"
        metricLabel="droga zakończona"
        title="Dziękujemy za wspólną drogę"
        description="To był wyjątkowy czas modlitwy, spotkań i wspólnego pielgrzymowania. Odpocznij dobrze — do zobaczenia na szlaku za rok!"
        footer="Do zobaczenia za rok"
        onSettings={onSettings}
      />
    );
  }

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
                    onClick={() => navigate('/konferencja/' + day.dayNumber)} />
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
