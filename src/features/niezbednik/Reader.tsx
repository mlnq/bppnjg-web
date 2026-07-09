import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Reader, Header, Loader } from '../../components';
import { Icon } from '../../lib/icons';
import { CONTENT_MAP } from '../../data/content';
import { useBreviary } from '../../lib/useBreviary';
import { useNiedziela } from '../../lib/useNiedziela';
import type { Akapit } from '../../data/types';
import type { BreviaryOffice } from '../../lib/useBreviary';
import type { NiedzielaDailyReadings } from '../../lib/useNiedziela';

function breviaryToAkapity(office: BreviaryOffice): Akapit[] {
  const out: Akapit[] = [];
  if (office.liturgicalDay) out.push({ typ: 'lead', t: office.liturgicalDay });
  if (office.season) out.push({ typ: 'p', t: office.season });
  for (const section of office.sections) {
    out.push({ typ: 'h3', t: section.title });
    for (const line of section.body.split('\n\n').filter(Boolean)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith('W.') || trimmed.startsWith('R.') || trimmed.startsWith('†')) {
        out.push({ typ: 'resp', t: trimmed });
      } else {
        out.push({ typ: 'p', t: trimmed });
      }
    }
  }
  return out;
}

function niedzielaToAkapity(data: NiedzielaDailyReadings): Akapit[] {
  const out: Akapit[] = [];
  if (data.season) out.push({ typ: 'lead', t: data.season });
  for (const r of data.readings) {
    out.push({ typ: 'h3', t: `${r.label} (${r.reference})` });
    if (r.title) out.push({ typ: 'source', t: r.title });
    if (r.introduction) out.push({ typ: 'p', t: r.introduction });
    for (const para of r.body.split('\n\n').filter(Boolean)) {
      out.push({ typ: 'p', t: para.trim() });
    }
  }
  return out;
}

function BrewiarzReader({ onBack }: { onBack: () => void }) {
  const { data, isLoading, error } = useBreviary('jutrznia');

  if (isLoading) return (
    <Reader title="Brewiarz" onBack={onBack} kickerIcon="church" kickerTone="blue"
      kickerLabel="Liturgia godzin" headline="Jutrznia"
      akapity={[]} loading />
  );

  if (error || !data) return (
    <Reader title="Brewiarz" onBack={onBack} kickerIcon="church" kickerTone="blue"
      kickerLabel="Liturgia godzin" headline="Jutrznia"
      akapity={[{ typ: 'p', t: 'Nie można pobrać brewiarza. Sprawdź połączenie.' }]} />
  );

  return (
    <Reader
      title="Brewiarz"
      onBack={onBack}
      kickerIcon="church"
      kickerTone="blue"
      kickerLabel={data.date || 'Liturgia godzin'}
      headline={data.officeLabel}
      akapity={breviaryToAkapity(data)}
    />
  );
}

function CzytaniaReader({ onBack }: { onBack: () => void }) {
  const { data, isLoading, error } = useNiedziela();

  if (isLoading) return (
    <Reader title="Czytania" onBack={onBack} kickerIcon="book-open" kickerTone="amber"
      kickerLabel="Liturgia słowa" headline="Czytania dnia"
      akapity={[]} loading />
  );

  if (error || !data) return (
    <Reader title="Czytania" onBack={onBack} kickerIcon="book-open" kickerTone="amber"
      kickerLabel="Liturgia słowa" headline="Czytania dnia"
      akapity={[{ typ: 'p', t: 'Nie można pobrać czytań. Sprawdź połączenie.' }]} />
  );

  return (
    <Reader
      title="Czytania"
      onBack={onBack}
      kickerIcon="book-open"
      kickerTone="amber"
      kickerLabel={data.celebration ?? data.season ?? 'Liturgia słowa'}
      headline="Czytania dnia"
      akapity={niedzielaToAkapity(data)}
    />
  );
}

type Song = { title: string; lines: { text: string; chords: string[] }[] };

function SongDetail({ song, onBack }: { song: Song; onBack: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  return (
    <>
      <Header title="Śpiewnik" onBack={onBack} scrolled={scrolled} />
      <div className="viewport scroll" onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 4)}>
        <div className="stage">
          <span className="eyebrow eyebrow--wine">Pieśń</span>
          <h1 style={{
            fontFamily: 'var(--font-head)', fontWeight: 800,
            fontSize: 'clamp(22px, 5vw, 30px)', lineHeight: 1.15,
            letterSpacing: '-0.02em', color: 'var(--ink)',
            marginTop: 'var(--s2)', marginBottom: 0,
          } as React.CSSProperties}>
            {song.title}
          </h1>
          <hr style={{ height: 1, background: 'var(--line)', border: 0, margin: 'var(--s5) 0' }} />
          <div style={{ fontFamily: 'var(--font-read)', fontSize: 16, lineHeight: 1.75, color: '#2C2C30' }}>
            {song.lines.map((line, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                columnGap: 20,
                alignItems: 'start',
                padding: '2px 0',
              }}>
                <span>{line.text}</span>
                <span style={{
                  fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700,
                  color: 'var(--wine)', whiteSpace: 'nowrap', letterSpacing: '0.03em',
                  paddingTop: 2,
                  visibility: line.chords.length > 0 ? 'visible' : 'hidden',
                }}>
                  {line.chords.join('  ') || ' '}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function SpiewnikReader({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Song | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ['spiewnik'],
    queryFn: () =>
      fetch('/spiewnik_pielgrzymkowy.json')
        .then(r => r.json())
        .then((d: { songs: Song[] }) => d.songs),
    staleTime: Infinity,
  });

  if (selected) return <SongDetail song={selected} onBack={() => setSelected(null)} />;

  const q = query.toLowerCase();
  const filtered = songs
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !q || s.title.toLowerCase().includes(q));

  return (
    <>
      <Header title="Śpiewnik" onBack={onBack} scrolled={scrolled} />
      <div className="viewport scroll" onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 4)}>
        <div className="stage">
          <div style={{ position: 'relative', marginBottom: 'var(--s4)' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 18, color: 'var(--muted)', pointerEvents: 'none', lineHeight: 0,
            }}>
              <Icon name="text" />
            </span>
            <input
              type="search"
              placeholder="Szukaj pieśni…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', padding: '13px 16px 13px 44px',
                borderRadius: 'var(--r-inner)',
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                fontFamily: 'var(--font-body)', fontSize: 16,
                color: 'var(--ink)', outline: 'none',
                boxShadow: 'var(--sh-sm)',
              }}
            />
          </div>

          {isLoading ? (
            <Loader />
          ) : filtered.length === 0 ? (
            <div className="card" style={{ padding: 'var(--s8)', textAlign: 'center' }}>
              <p className="muted">Brak wyników dla „{query}"</p>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {filtered.map(({ s, i }, fi) => (
                <button
                  key={i}
                  onClick={() => setSelected(s)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--s3)',
                    width: '100%', padding: 'var(--s3) var(--s5)',
                    borderBottom: fi < filtered.length - 1 ? '1px solid var(--line-2)' : 'none',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--muted)',
                    fontFamily: 'var(--font-head)', letterSpacing: '.05em',
                    minWidth: 28, flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.4 }}>
                    {s.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function NiezbednikReader() {
  const { modul } = useParams<{ modul: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate(-1);

  if (modul === 'brewiarz') return <BrewiarzReader onBack={onBack} />;
  if (modul === 'czytania') return <CzytaniaReader onBack={onBack} />;
  if (modul === 'spiewnik') return <SpiewnikReader onBack={onBack} />;

  const m = CONTENT_MAP[modul ?? ''] ?? CONTENT_MAP.modlitewnik;
  return (
    <Reader
      title={m.modul}
      onBack={onBack}
      kickerIcon={m.ic}
      kickerTone={m.kolor}
      kickerLabel={m.sub}
      headline={m.tytul}
      akapity={m.akapity}
    />
  );
}
