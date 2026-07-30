import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Reader, Loader, ScreenTools } from '../../components';
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
      akapity={[{ typ: 'p', t: 'Dzisiejsza treść nie została jeszcze zapisana offline.' }]} />
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
      akapity={[{ typ: 'p', t: 'Dzisiejsza treść nie została jeszcze zapisana offline.' }]} />
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
const SONGBOOK_URL = `${import.meta.env.BASE_URL}spiewnik_pielgrzymkowy.json`;

const GODZINKI_HEADINGS = new Set([
  'Na Jutrznię', 'Na Prymę', 'Na Tercję', 'Na Sekstę', 'Na Nonę',
  'Na Nieszpory', 'Kompleta', 'Hymn', 'Ofiarowanie Godzinek',
  'Antyfona', 'Módlmy się:',
]);

function godzinkiToAkapity(lines: Song['lines']): Akapit[] {
  return lines.map(({ text }) => ({
    typ: GODZINKI_HEADINGS.has(text)
      ? 'h3'
      : /^(P\.|W\.)/.test(text)
        ? 'resp'
        : 'p',
    t: text,
  }));
}

function ModlitewnikReader({ onBack }: { onBack: () => void }) {
  const { data: godzinki, isLoading, error } = useQuery({
    queryKey: ['godzinki-niepokalane-poczecie'],
    queryFn: async () => {
      const response = await fetch(SONGBOOK_URL, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Songbook ${response.status}`);
      const data = await response.json() as { songs: Song[] };
      const song = data.songs.find(({ lines }) =>
        lines.some(({ text }) => text === 'Ofiarowanie Godzinek'),
      );
      if (!song) throw new Error('Godzinki not found');
      return song;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  if (isLoading) return (
    <Reader title="Modlitewnik" onBack={onBack} kickerIcon="book-heart" kickerTone="green"
      kickerLabel="Modlitwa maryjna" headline="Godzinki o Niepokalanym Poczęciu NMP"
      akapity={[]} loading />
  );

  if (error || !godzinki) return (
    <Reader title="Modlitewnik" onBack={onBack} kickerIcon="book-heart" kickerTone="green"
      kickerLabel="Modlitwa maryjna" headline="Godzinki o Niepokalanym Poczęciu NMP"
      akapity={[{ typ: 'p', t: 'Godzinki nie są jeszcze dostępne offline. Otwórz modlitewnik raz przy połączeniu z internetem, aby zapisać je w pamięci aplikacji.' }]} />
  );

  return (
    <Reader
      title="Modlitewnik"
      onBack={onBack}
      kickerIcon="book-heart"
      kickerTone="green"
      kickerLabel="Modlitwa maryjna"
      headline="Godzinki o Niepokalanym Poczęciu NMP"
      akapity={godzinkiToAkapity(godzinki.lines)}
    />
  );
}

function SongDetail({ song, onBack }: { song: Song; onBack: () => void }) {
  return (
    <div className="viewport scroll">
      <div className="stage">
          <ScreenTools onBack={onBack} backLabel="Śpiewnik" />
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
  );
}

function SpiewnikReader({ onBack }: { onBack: () => void }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Song | null>(null);
  const { data: songs = [], isLoading, error } = useQuery({
    queryKey: ['spiewnik'],
    queryFn: async () => {
      const r = await fetch(SONGBOOK_URL, { cache: 'force-cache' });
      if (!r.ok) throw new Error(`Songbook ${r.status}`);
      const d = await r.json() as { songs: Song[] };
      return d.songs;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  if (selected) return <SongDetail song={selected} onBack={() => setSelected(null)} />;

  const q = query.toLowerCase();
  const filtered = songs
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => !q || s.title.toLowerCase().includes(q));

  return (
    <div className="viewport scroll">
      <div className="stage">
          <ScreenTools onBack={onBack} backLabel="Niezbędnik" />
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
          ) : error ? (
            <div className="card" style={{ padding: 'var(--s8)', textAlign: 'center' }}>
              <p className="muted" style={{ margin: 0 }}>
                Śpiewnik nie jest jeszcze dostępny offline. Otwórz go raz przy połączeniu z internetem, aby zapisać go w pamięci aplikacji.
              </p>
            </div>
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
  );
}

export function NiezbednikReader() {
  const { modul } = useParams<{ modul: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate(-1);

  if (modul === 'brewiarz') return <BrewiarzReader onBack={onBack} />;
  if (modul === 'czytania') return <CzytaniaReader onBack={onBack} />;
  if (modul === 'spiewnik') return <SpiewnikReader onBack={onBack} />;
  if (modul === 'modlitewnik') return <ModlitewnikReader onBack={onBack} />;

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
