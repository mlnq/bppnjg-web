import { Outlet, NavLink } from 'react-router-dom';
import { Icon } from '../lib/icons';

const TABS = [
  { to: '/', end: true, lbl: 'Start', icon: 'home' },
  { to: '/trasa', lbl: 'Trasa', icon: 'map' },
  { to: '/info', lbl: 'Info', icon: 'message' },
  { to: '/kwatermistrz', lbl: 'Kwater.', icon: 'alert' },
  { to: '/niezbednik', lbl: 'Niezbędnik', icon: 'book-open' },
] as const;

export function Shell() {
  return (
    <div
      className="app"
      data-type="spokoj"
      data-read="sans"
      data-accent="subtelny"
      style={{ ['--read-scale' as string]: 1 }}
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
