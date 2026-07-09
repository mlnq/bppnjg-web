import { useNavigate } from 'react-router-dom';
import { usePilgrimage, type Ustawienia } from '../../app/PilgrimageContext';
import { Eyebrow, ScreenTools } from '../../components';

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

export function UstawieniaScreen() {
  const navigate = useNavigate();
  const { settings, setSettings } = usePilgrimage();
  const set = <K extends keyof Ustawienia>(k: K, v: Ustawienia[K]) =>
    setSettings({ ...settings, [k]: v });
  const isDev = import.meta.env.DEV;

  return (
    <div className="viewport scroll">
      <div className="stage" style={{ maxWidth: 620 }}>
          <ScreenTools onBack={() => navigate(-1)} backLabel="Wróć" />

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

          {isDev && (
            <>
              <Eyebrow className="enter enter-2" style={{ margin: 'var(--s6) 0 var(--s3)', color: '#b00020' }}>DEV · Symulator dnia</Eyebrow>
              <div className="setgroup enter enter-2">
                <div className="setrow" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--s3)' }}>
                  <div className="setrow__body" style={{ padding: 0 }}>
                    <div className="setrow__t">
                      {settings.devDay === null
                        ? 'Prawdziwa data'
                        : settings.devDay < 1
                          ? 'Przed pielgrzymką'
                          : settings.devDay > 14
                            ? 'Po pielgrzymce'
                            : `Dzień ${settings.devDay} z 14`}
                    </div>
                    <div className="setrow__d">
                      {settings.devDay === null
                        ? 'Używana jest prawdziwa data urządzenia.'
                        : 'Nadpisana ręcznie. Reset → prawdziwa data.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
                    <button
                      className="iconbtn"
                      onClick={() => set('devDay', Math.max(0, (settings.devDay ?? 1) - 1))}
                      aria-label="Poprzedni dzień"
                      style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--paper-sunk)' }}>
                      −
                    </button>
                    <button
                      className="iconbtn"
                      onClick={() => set('devDay', Math.min(15, (settings.devDay ?? 1) + 1))}
                      aria-label="Następny dzień"
                      style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--paper-sunk)' }}>
                      +
                    </button>
                    {settings.devDay !== null && (
                      <button
                        onClick={() => set('devDay', null)}
                        style={{ padding: '6px 16px', borderRadius: 999, background: '#fde8e8', color: '#b00020', fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

      </div>
    </div>
  );
}
