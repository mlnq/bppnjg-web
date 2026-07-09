import { Icon } from '../lib/icons';

type HeaderProps = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  scrolled?: boolean;
};

export function Header({ title, onBack, right, scrolled }: HeaderProps) {
  return (
    <header
      className={'hdr' + (scrolled ? ' scrolled' : '')}
      data-has-back={onBack ? 'true' : 'false'}
      data-has-right={right ? 'true' : 'false'}
    >
      {onBack ? (
        <button className="hdr__btn left" onClick={onBack} aria-label="Wstecz">
          <Icon name="chevron-left" />
        </button>
      ) : (
        <span className="hdr__btn left" />
      )}
      <h1 className="hdr__title">{title}</h1>
      {right ?? <span className="hdr__btn right" />}
    </header>
  );
}
