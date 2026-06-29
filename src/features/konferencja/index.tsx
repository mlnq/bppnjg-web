import { useNavigate } from 'react-router-dom';
import { usePilgrimage } from '../../app/PilgrimageContext';
import { Reader } from '../../components';
import { Icon } from '../../lib/icons';

export function KonferencjaScreen() {
  const navigate = useNavigate();
  const { state } = usePilgrimage();
  if (state.status !== 'ok') return null;

  const k = state.day.conference;
  const headline = k?.title ?? 'Konferencja zostanie dodana przed etapem';
  const content = k?.content ?? 'Tutaj pojawi się temat i treść konferencji przygotowanej na dany dzień pielgrzymki.';
  const initials = k?.author?.split(' ').filter((w) => /^[A-ZŻŹĆŁ]/.test(w)).map((w) => w[0]).slice(0, 2).join('') ?? '';
  const dayNr = state.day.dayNumber;

  return (
    <Reader
      title="Konferencja"
      onBack={() => navigate(-1)}
      kickerIcon="book"
      kickerLabel={'Konferencja · Dzień ' + dayNr}
      headline={headline}
      byline={
        k ? (
          <div className="reader__byline">
            <span className="av">{initials}</span>
            <span><b style={{ color: 'var(--ink)', fontWeight: 700 }}>{k.author}</b></span>
          </div>
        ) : null
      }
      akapity={[{ typ: 'lead' as const, t: content }]}
      dropcap
      footer={
        <div className="center mt6">
          <span className="localnote"><Icon name="check" />Konferencja zapisana do czytania offline</span>
        </div>
      }
    />
  );
}
