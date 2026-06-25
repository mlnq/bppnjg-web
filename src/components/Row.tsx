import { Icon } from '../lib/icons';
import { Chip } from './Chip';

type RowProps = {
  icon?: string;
  tone?: 'rose' | 'amber' | 'green' | 'blue';
  title: string;
  meta?: string;
  right?: React.ReactNode;
  onClick?: () => void;
};

export function Row({ icon, tone = 'rose', title, meta, right, onClick }: RowProps) {
  return (
    <button className="row" onClick={onClick}>
      {icon && <Chip icon={icon} tone={tone} round />}
      <span className="row__body">
        <span className="row__title">{title}</span>
        {meta && <span className="row__meta">{meta}</span>}
      </span>
      {right ?? <Icon name="chevron-right" className="row__chev" />}
    </button>
  );
}
