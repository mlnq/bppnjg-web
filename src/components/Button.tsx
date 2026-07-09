import { Icon } from '../lib/icons';

type ButtonProps = {
  children: React.ReactNode;
  variant?: 'wine' | 'ghost';
  icon?: string;
  iconRight?: string;
  block?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
  ariaLabel?: string;
};

export function Button({
  children, variant = 'wine', icon, iconRight, block,
  onClick, type = 'button', className = '', ariaLabel,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={ariaLabel}
      className={'btn btn--' + variant + (block ? ' btn--block' : '') + ' ' + className}
    >
      {icon && <Icon name={icon} />}
      {children}
      {iconRight && <Icon name={iconRight} />}
    </button>
  );
}
