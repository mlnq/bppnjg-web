import { Icon } from '../lib/icons';

type PillProps = {
  children: React.ReactNode;
  variant?: 'rose' | 'ghost';
  icon?: string;
  className?: string;
};

export function Pill({ children, variant = 'rose', icon, className = '' }: PillProps) {
  return (
    <span className={'pill pill--' + variant + ' ' + className}>
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
}
