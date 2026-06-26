import { Eyebrow } from '../../components';
import type { ZrodloPozycji } from '../../lib/usePozycja';

type Props = { zrodlo: ZrodloPozycji };

export function StatusWidget({ zrodlo }: Props) {
  const rows = [
    { c: 'var(--good)', t: 'Kolumna w drodze — etap rozpoczęty' },
    { c: zrodlo === 'gps' ? 'var(--good)' : 'var(--warn)', t: zrodlo === 'gps' ? 'Pozycja GPS aktywna' : 'GPS wyłączony — pozycja z harmonogramu' },
    { c: 'var(--good)', t: 'Dane zapisane lokalnie' },
  ];
  return (
    <div className="widget enter enter-3">
      <div className="widget__h"><Eyebrow>Status dnia</Eyebrow></div>
      <div className="status">
        {rows.map((r, i) => (
          <div className="status__row" key={i}>
            <span className="status__dot" style={{ background: r.c }} />
            {r.t}
          </div>
        ))}
      </div>
    </div>
  );
}
