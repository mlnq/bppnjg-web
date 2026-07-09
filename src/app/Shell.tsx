import { Outlet, NavLink } from 'react-router-dom';
import { Icon } from '../lib/icons';
import { usePilgrimage } from './PilgrimageContext';

const TABS = [
  { to: '/', end: true, lbl: 'Start', icon: 'home' },
  { to: '/trasa', lbl: 'Trasa', icon: 'map' },
  { to: '/info', lbl: 'Info', icon: 'message' },
  { to: '/kwatermistrz', lbl: 'Kwater.', icon: 'alert' },
  { to: '/niezbednik', lbl: 'Niezbędnik', icon: 'book-open' },
] as const;

export function Shell() {
  const { settings } = usePilgrimage();
  return (
    <div
      className="app"
      data-type={settings.type}
      data-read={settings.read}
      data-accent={settings.accent}
      style={{ ['--read-scale' as string]: settings.readScale }}
    >
      <Outlet />
      <nav className="tabbar" aria-label="Główna nawigacja">
        <div className="tabbar__inner">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={'end' in t ? t.end : undefined} className="tab">
              <Icon name={t.icon} />
              <span className="tab__lbl">{t.lbl}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
