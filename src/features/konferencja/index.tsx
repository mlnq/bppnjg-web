import { useNavigate, useParams } from 'react-router-dom';
import { usePilgrimage } from '../../app/PilgrimageContext';
import { Loader, Reader } from '../../components';
import { Icon } from '../../lib/icons';
import type { Akapit } from '../../data/types';

function toAkapity(text: string): Akapit[] {
  const parts = text.split(/\n\n+/).filter(Boolean);
  return parts.map((t, i) => ({ typ: (i === 0 ? 'drop' : 'p') as Akapit['typ'], t }));
}

export function KonferencjaScreen() {
  const navigate = useNavigate();
  const { nr } = useParams<{ nr: string }>();
  const { state } = usePilgrimage();
  if (state.status === 'loading') return <Loader fullscreen />;
  if (state.status !== 'ok') return <p className="muted" style={{ padding: 32 }}>{state.message}</p>;

  const dayNr = Number(nr);
  const day = state.pilgrimage.days.find((d) => d.dayNumber === dayNr) ?? state.day;
  const k = day.conference;

  const headline = k?.title ?? 'Konferencja zostanie dodana przed etapem';
  const content = k?.content ?? 'Tutaj pojawi się temat i treść konferencji przygotowanej na dany dzień pielgrzymki.';
  const initials = k?.author?.split(' ').filter((w) => /^[A-ZŻŹĆŁ]/.test(w)).map((w) => w[0]).slice(0, 2).join('') ?? '';

  return (
    <Reader
      title="Konferencja"
      onBack={() => navigate(-1)}
      kickerIcon="book"
      kickerLabel={'Konferencja · Dzień ' + day.dayNumber}
      headline={headline}
      byline={
        k?.author ? (
          <div className="reader__byline">
            <span className="av">{initials}</span>
            <span><b style={{ color: 'var(--ink)', fontWeight: 700 }}>{k.author}</b></span>
          </div>
        ) : null
      }
      akapity={toAkapity(content)}
      dropcap
      footer={
        <div className="center mt6">
          <span className="localnote"><Icon name="check" />Konferencja zapisana do czytania offline</span>
        </div>
      }
    />
  );
}
