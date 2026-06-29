import { useNavigate } from 'react-router-dom';
import { usePilgrimage, type Ustawienia } from '../../app/PilgrimageContext';
import { Header, Eyebrow } from '../../components';

function Seg<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { v: T; l: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={o.v} aria-pressed={value === o.v} onClick={() => onChange(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return <button className="switch" aria-pressed={on} onClick={onToggle}><i /></button>;
}

export function UstawieniaScreen() {
  const navigate = useNavigate();
  const { settings, setSettings } = usePilgrimage();
  const set = <K extends keyof Ustawienia>(k: K, v: Ustawienia[K]) =>
    setSettings({ ...settings, [k]: v });

  return (
    <>
      <Header title="Ustawienia" onBack={() => navigate(-1)} />
      <div className="viewport scroll">
        <div className="stage" style={{ maxWidth: 620 }}>

          <Eyebrow className="enter enter-1" style={{ marginBottom: 'var(--s3)' }}>Źródło lokalizacji</Eyebrow>
          <div className="setgroup enter enter-1">
            <div className="setrow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--s3)' }}>
              <div className="setrow__body" style={{ padding: 0 }}>
                <div className="setrow__t">Jak ustalamy Twoją pozycję</div>
                <div className="setrow__d">Auto przełącza na harmonogram, gdy brak sygnału GPS.</div>
              </div>
              <Seg
                value={settings.tryb}
                onChange={(v) => set('tryb', v)}
                options={[{ v: 'auto', l: 'Auto' }, { v: 'gps', l: 'Tylko GPS' }, { v: 'plan', l: 'Harmonogram' }]}
              />
            </div>
          </div>

          <Eyebrow className="enter enter-2" style={{ margin: 'var(--s6) 0 var(--s3)' }}>Typografia</Eyebrow>
          <div className="setgroup enter enter-2">
            <div className="setrow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--s3)' }}>
              <div className="setrow__body" style={{ padding: 0 }}>
                <div className="setrow__t">Kierunek typografii</div>
              </div>
              <Seg
                value={settings.type}
                onChange={(v) => set('type', v)}
                options={[{ v: 'spokoj', l: 'Spokój' }, { v: 'pielgrzym', l: 'Pielgrzym' }, { v: 'ostry', l: 'Ostry' }]}
              />
            </div>
            <div className="setrow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--s3)', marginTop: 'var(--s3)' }}>
              <div className="setrow__body" style={{ padding: 0 }}>
                <div className="setrow__t">Font czytania</div>
              </div>
              <Seg
                value={settings.read}
                onChange={(v) => set('read', v)}
                options={[{ v: 'sans', l: 'Bezszeryfowy' }, { v: 'serif', l: 'Szeryfowy' }]}
              />
            </div>
          </div>

          <Eyebrow className="enter enter-3" style={{ margin: 'var(--s6) 0 var(--s3)' }}>Akcent kolorów</Eyebrow>
          <div className="setgroup enter enter-3">
            <div className="setrow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--s3)' }}>
              <div className="setrow__body" style={{ padding: 0 }}>
                <div className="setrow__t">Nasycenie kafli modułów</div>
              </div>
              <Seg
                value={settings.accent}
                onChange={(v) => set('accent', v)}
                options={[{ v: 'subtelny', l: 'Subtelny' }, { v: 'wyrazisty', l: 'Wyrazisty' }]}
              />
            </div>
          </div>

          <Eyebrow className="enter enter-4" style={{ margin: 'var(--s6) 0 var(--s3)' }}>Dane offline</Eyebrow>
          <div className="setgroup enter enter-4">
            <div className="setrow">
              <span className="setrow__body">
                <span className="setrow__t">Treści offline</span>
                <span className="setrow__d">Trasa, konferencje i modlitwy zapisane lokalnie</span>
              </span>
              <Switch on={true} onToggle={() => {}} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
