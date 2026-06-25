import { Icon } from '../lib/icons';

type ChipProps = {
  icon: string;
  tone?: 'rose' | 'amber' | 'green' | 'blue';
  round?: boolean;
  size?: number;
};

export function Chip({ icon, tone = 'rose', round, size }: ChipProps) {
  return (
    <span
      className={'chip chip--' + tone + (round ? ' chip--round' : '')}
      style={size ? { width: size, height: size, fontSize: size * 0.5 } : undefined}
    >
      <Icon name={icon} />
    </span>
  );
}
