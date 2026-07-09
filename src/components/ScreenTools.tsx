import { Button } from './Button';

type ScreenToolsProps = {
  onBack?: () => void;
  backLabel?: string;
  backAriaLabel?: string;
  right?: React.ReactNode;
  className?: string;
};

export function ScreenTools({
  onBack,
  backLabel = 'Wróć',
  backAriaLabel,
  right,
  className = '',
}: ScreenToolsProps) {
  if (!onBack && !right) return null;

  return (
    <div className={'screen-tools' + (!onBack ? ' screen-tools--end' : '') + (className ? ' ' + className : '')}>
      {onBack ? (
        <Button variant="ghost" icon="chevron-left" onClick={onBack} ariaLabel={backAriaLabel}>
          {backLabel}
        </Button>
      ) : (
        <span />
      )}
      {right ? <div className="screen-tools__right">{right}</div> : null}
    </div>
  );
}
