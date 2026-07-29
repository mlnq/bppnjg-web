import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Prose, Loader, Button } from '../../components';
import { useAudioKonferencja, SPEED_LBL } from '../../lib/useAudioKonferencja';
import { api, konferencjaId, konferencjaNr } from '../../data/api';

const fmt = (s: number) => {
  s = Math.max(0, Math.round(s || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const FALLBACK_PEAKS = Array.from({ length: 46 }, (_, i) =>
  0.32 + 0.6 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.29 + 1.3)));

export function KonferencjaPlayer() {
  const { nr: routeId } = useParams<{ nr: string }>();
  const nav = useNavigate();
  const isDayNumber = /^\d+$/.test(routeId ?? '');
  const conferenceId = isDayNumber ? konferencjaId(Number(routeId)) : (routeId ?? '');
  const parsedDayNr = konferencjaNr(conferenceId);
  const dayNr = Number.isFinite(parsedDayNr) ? parsedDayNr : 0;

  const { data: k, isLoading } = useQuery({
    queryKey: ['konferencja', conferenceId],
    queryFn: () => api.getKonferencjaById(conferenceId),
    enabled: Boolean(conferenceId),
  });

  const { ref, t, dur, pct, playing, rate, toggle, seek, skip, restart, stop, cycleSpeed } =
    useAudioKonferencja(dayNr, k?.mp3Url ?? '');

  const [scrolled, setScrolled] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cueRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const dragging = useRef(false);

  const inicjaly = useMemo(() => {
    if (!k) return '';
    return k.autor.split(' ').filter((w) => /^[A-ZŻŹĆŁ]/.test(w)).map((w) => w[0]).slice(0, 2).join('');
  }, [k]);

  const activeCue = useMemo(() => {
    if (!k?.cues) return -1;
    const currentMs = t * 1000;
    return k.cues.findIndex((cue) => currentMs >= cue.start && currentMs < cue.end);
  }, [k?.cues, t]);

  useEffect(() => {
    if (!playing || activeCue < 0) return;
    cueRefs.current[activeCue]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeCue, playing]);

  if (isLoading) return <Loader fullscreen />;

  if (!k) {
    return (
      <div className="viewport scroll">
        <div className="stage" style={{ paddingTop: 'var(--s10)', textAlign: 'center' }}>
          <p className="muted">Konferencja pojawi się przed etapem.</p>
          <div style={{ marginTop: 'var(--s5)' }}>
            <Button variant="ghost" icon="chevron-left" onClick={() => nav(-1)}>Wróć</Button>
          </div>
        </div>
      </div>
    );
  }

  const seekFromX = (clientX: number) => {
    const el = trackRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    seek(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * dur);
  };

  return (
    <div className={'konf' + (scrolled ? ' is-scrolled' : '')}>
      <audio ref={ref} src={k.mp3Url} preload="metadata" />

      <div className="viewport scroll" onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 180)}>
        <div className="konf-hero">
          <div className="konf-hero__halo" />
          <div className="konf-hero__art">
            <Headphones size={120} stroke="#fff" />
          </div>
          <div className="konf-hero__eyebrow">{dayNr ? `Konferencja · Dzień ${dayNr}` : 'Konferencja'}</div>
          <h1 className="konf-hero__title">{k.tytul}</h1>
          <div className="konf-hero__by">
            <span className="konf-hero__av">{inicjaly}</span>
            <span><b>{k.autor}</b></span>
          </div>
        </div>

        <div className="stage" style={{ paddingTop: 'var(--s5)' }}>
          <div className="card konf-player" style={{ padding: 'var(--s5)' }}>
            <div
              ref={trackRef}
              className="konf-wave"
              onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); seekFromX(e.clientX); }}
              onPointerMove={(e) => { if (dragging.current) seekFromX(e.clientX); }}
              onPointerUp={() => { dragging.current = false; }}
            >
              {FALLBACK_PEAKS.map((h, i) => {
                const on = (i / (FALLBACK_PEAKS.length - 1)) <= pct;
                return (
                  <span key={i} style={{
                    height: Math.round(h * 36) + 7,
                    background: on ? 'var(--wine)' : 'var(--paper-sunk)',
                  }} />
                );
              })}
            </div>

            <div className="konf-times"><b>{fmt(t)}</b><span>{fmt(dur)}</span></div>

            <div className="konf-controls">
              <button className="konf-ctl konf-ctl--sm" onClick={restart} title="Od początku">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M18 19 8 12l10-7z" /><rect x="5" y="5" width="2.2" height="14" rx="1" /></svg>
              </button>
              <button className="konf-ctl" onClick={() => skip(-10)} title="10 sekund wstecz">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a8 8 0 1 1-7.6 5.6" /><path d="M4 4v5h5" /></svg>
                <span className="konf-ctl__n">10</span>
              </button>
              <button className="konf-play" onClick={playing ? stop : toggle} aria-label={playing ? 'Zatrzymaj' : 'Odtwórz'}>
                {playing
                  ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
                  : <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5.2v13.6L19 12z" /></svg>}
              </button>
              <button className="konf-ctl" onClick={() => skip(10)} title="10 sekund naprzód">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5a8 8 0 1 0 7.6 5.6" /><path d="M20 4v5h-5" /></svg>
                <span className="konf-ctl__n">10</span>
              </button>
              <button className="konf-speed" onClick={cycleSpeed} title="Prędkość">{SPEED_LBL[rate]}</button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 'var(--s7) 0 var(--s4)' }}>
            <span className="eyebrow eyebrow--wine">Transkrypcja nagrania</span>
            <span className="localnote" style={{ marginLeft: 'auto' }}>do czytania</span>
          </div>
          {k.cues?.length ? (
            <div className="prose konf-transcript" aria-label="Synchronizowana transkrypcja">
              {k.cues.map((cue, index) => (
                <button
                  key={`${cue.start}-${index}`}
                  ref={(element) => { cueRefs.current[index] = element; }}
                  type="button"
                  className={'konf-transcript__cue' + (index === activeCue ? ' is-active' : '')}
                  onClick={() => seek(cue.start / 1000)}
                  aria-current={index === activeCue ? 'true' : undefined}
                >
                  {cue.text}
                </button>
              ))}
            </div>
          ) : <Prose akapity={k.akapity ?? []} dropcap />}

          <div className="center" style={{ marginTop: 'var(--s6)' }}>
            <span className="localnote">Zapisane offline — nagranie i tekst</span>
          </div>
        </div>
      </div>

      <button className="konf-back" onClick={() => nav(-1)} aria-label="Wstecz">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>

      <div className="konf-mini">
        <button className="hdr__btn left" style={{ width: 38, height: 38, flex: 'none' }} onClick={() => nav(-1)} aria-label="Wstecz">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <button className="konf-mini__play" onClick={playing ? stop : toggle} aria-label={playing ? 'Zatrzymaj' : 'Odtwórz'}>
          {playing
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1.5" /></svg>
            : <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}><path d="M8 5.2v13.6L19 12z" /></svg>}
        </button>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.tytul}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span className="konf-mini__bar"><i style={{ width: pct * 100 + '%' }} /></span>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 10.5, color: 'var(--muted)' }}>{fmt(t)}</span>
          </span>
        </span>
        <button className="konf-speed" style={{ minWidth: 36, height: 30, fontSize: 12 }} onClick={cycleSpeed}>{SPEED_LBL[rate]}</button>
      </div>
    </div>
  );
}

function Headphones({ size = 24, stroke = 'currentColor' }: { size?: number; stroke?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
      <rect x="3.2" y="13.4" width="4.4" height="7" rx="2" />
      <rect x="16.4" y="13.4" width="4.4" height="7" rx="2" />
    </svg>
  );
}
