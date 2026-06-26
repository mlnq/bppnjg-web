import { Icon } from '../../lib/icons';
import { fmt } from '../../lib/format';
import type { ApiStop } from '../../data/types';

const STOP_ICON: Record<string, string> = {
  start: 'flag',
  night: 'bed',
};

function badgeIcon(badge?: string | null): string {
  if (badge === 'Modlitwa') return 'cross';
  if (badge === 'Postój') return 'coffee';
  if (badge === 'Konferencja') return 'book';
  return 'map-pin';
}

type ItemProps = { stop: ApiStop; state: 'done' | 'now' | 'next'; distToNext?: number };

export function TimelineItem({ stop, state: s, distToNext }: ItemProps) {
  const cls = s === 'now' ? 'is-now' : s === 'done' ? 'is-done' : '';
  const icon = STOP_ICON[stop.type] ?? badgeIcon(stop.badge);
  return (
    <div className={'tl__item ' + cls}>
      <span className="tl__node"><i /></span>
      <div className="tl__stop">
        <div className="tl__time">
          <Icon name={icon} />{stop.time}
          {stop.durationMin ? (
            <span className="badge tl__badge"><Icon name="timer" />{stop.durationMin} min</span>
          ) : null}
          {s === 'now' && <span className="badge badge--now tl__badge">Teraz</span>}
        </div>
        <div className="tl__place">{stop.townName ?? stop.name}</div>
        {stop.description && <div className="tl__desc">{stop.description}</div>}
      </div>
      {distToNext != null && distToNext > 0 && (
        <div className="tl__seg"><Icon name="footprints" />{fmt(distToNext)} km</div>
      )}
    </div>
  );
}
