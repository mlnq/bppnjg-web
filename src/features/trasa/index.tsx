import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePilgrimage } from '../../app/PilgrimageContext';
import { toDzien, buildKmCumulative } from '../../data/api';
import { usePozycja } from '../../lib/usePozycja';
import type { ApiPilgrimage, ApiPilgrimageDay } from '../../data/types';
import { fmt } from '../../lib/format';
import { Icon } from '../../lib/icons';
import { Pill, Progress, SectionHead, Button, Eyebrow, Loader } from '../../components';
import { TimelineItem } from './TimelineItem';

export function TrasaScreen() {
  const { state, settings } = usePilgrimage();
  if (state.status === 'loading') return <Loader fullscreen />;
  if (state.status !== 'ok') return <p className="muted" style={{ padding: 32 }}>{state.message}</p>;
  return <TrasaLoaded pilgrimage={state.pilgrimage} activeDay={state.day} tryb={settings.tryb} />;
}

function TrasaLoaded({ pilgrimage, activeDay, tryb }: { pilgrimage: ApiPilgrimage; activeDay: ApiPilgrimageDay; tryb: 'auto' | 'gps' | 'plan' }) {
  const navigate = useNavigate();
  const activeIdx = pilgrimage.days.findIndex((d) => d.dayNumber === activeDay.dayNumber);
  const [idx, setIdx] = useState(activeIdx >= 0 ? activeIdx : 0);
  const day = pilgrimage.days[idx];
  const dzien = toDzien(day);
  const pos = usePozycja(dzien, tryb);
  const kmCum = buildKmCumulative(day.stops);

  function stopState(stopKm: number): 'done' | 'now' | 'next' {
    if (idx !== activeIdx) return 'next';
    if (stopKm <= pos.km - 0.5) return 'done';
    if (stopKm <= pos.km + 2) return 'now';
    return 'next';
  }

  const hasSchedule = day.stops.length > 1;

  return (
    <div className="viewport scroll">
      <div className="stage">
          <div className="dayswitch enter enter-1">
            <button className="iconbtn" disabled={idx === 0} style={{ opacity: idx === 0 ? 0.35 : 1 }}
              onClick={() => setIdx((i) => Math.max(0, i - 1))} aria-label="Poprzedni dzień">
              <Icon name="chevron-left" />
            </button>
            <div className="center">
              <div className="dayswitch__label">Dzień {day.dayNumber} z {pilgrimage.totalDays}</div>
              <div className="dayswitch__sub">{dzien.od} → {dzien.do}</div>
            </div>
            <button className="iconbtn" disabled={idx === pilgrimage.days.length - 1}
              style={{ opacity: idx === pilgrimage.days.length - 1 ? 0.35 : 1 }}
              onClick={() => setIdx((i) => Math.min(pilgrimage.days.length - 1, i + 1))} aria-label="Następny dzień">
              <Icon name="chevron-right" />
            </button>
          </div>

          {hasSchedule ? (
            <>
              {pos.zrodlo === 'plan' && (
                <div className="alert alert--info enter enter-2" style={{ marginTop: 'var(--s4)' }}>
                  <Icon name="locate" className="alert__ic" />
                  <span className="alert__txt">GPS wyłączony — pozycja według harmonogramu</span>
                </div>
              )}
              <div className="card enter enter-2" style={{ padding: 'var(--s5)', marginTop: 'var(--s4)' }}>
                <div className="between">
                  <Pill variant="rose">Etap {day.dayNumber} z {pilgrimage.totalDays}</Pill>
                  <span className="eyebrow">{day.date}</span>
                </div>
                {idx === activeIdx ? (
                  <>
                    <div className="dial__num" style={{ marginTop: 'var(--s4)' }}>{fmt(pos.doCelu)}<small>km</small></div>
                    <Eyebrow wine>do celu</Eyebrow>
                  </>
                ) : (
                  <>
                    <div className="dial__num" style={{ marginTop: 'var(--s4)', color: 'var(--ink-2)' }}>
                      {fmt(kmCum[kmCum.length - 1] || day.route.totalDistanceKm)}<small style={{ color: 'var(--muted)' }}>km</small>
                    </div>
                    <Eyebrow>długość etapu</Eyebrow>
                  </>
                )}
                <div className="dial__route mt3">{dzien.od}<span className="arrow">→</span>{dzien.do}</div>
                {idx === activeIdx && (
                  <div className="mt4">
                    <Progress pct={pos.pct} leftLabel={fmt(pos.km) + ' km przebyto'} rightLabel={fmt(pos.doCelu) + ' km do celu'} />
                  </div>
                )}
              </div>

              <SectionHead>Plan dnia</SectionHead>
              <div className="card enter enter-3" style={{ padding: 'var(--s5) var(--s5) var(--s4)' }}>
                <div className="tl">
                  <div className="tl__line" />
                  {day.stops.map((stop, i) => (
                    <TimelineItem
                      key={stop.id}
                      stop={stop}
                      state={stopState(kmCum[i])}
                      distToNext={stop.distanceToNextKm > 0 ? stop.distanceToNextKm : undefined}
                    />
                  ))}
                </div>
              </div>
              <div className="center mt5">
                <Button variant="ghost" icon="book" onClick={() => navigate('/konferencja/' + day.dayNumber)}>
                  Konferencja dnia
                </Button>
              </div>
            </>
          ) : (
            <div className="card enter enter-2" style={{ padding: 'var(--s8) var(--s5)', marginTop: 'var(--s4)' }}>
              <div className="empty">
                <Icon name="calendar" className="empty__ic" />
                <div className="empty__t">Harmonogram dnia {day.dayNumber} pojawi się przed etapem</div>
                <p className="muted mt2" style={{ fontSize: 14 }}>{dzien.od} → {dzien.do} · {fmt(day.route.totalDistanceKm)} km</p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
