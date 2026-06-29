import { useParams, useNavigate } from 'react-router-dom';
import { Reader } from '../../components';
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
    if (r.title) out.push({ typ: 'verse', t: r.title });
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
      akapity={[{ typ: 'p', t: 'Pobieranie…' }]} />
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
      akapity={[{ typ: 'p', t: 'Pobieranie…' }]} />
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

export function NiezbednikReader() {
  const { modul } = useParams<{ modul: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate(-1);

  if (modul === 'brewiarz') return <BrewiarzReader onBack={onBack} />;
  if (modul === 'czytania') return <CzytaniaReader onBack={onBack} />;

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
