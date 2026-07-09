import { useRef } from 'react';
import { ReadProgress } from './ReadProgress';
import { Chip } from './Chip';
import { Eyebrow } from './Eyebrow';
import { Prose } from './Prose';
import { Loader } from './Loader';
import { ScreenTools } from './ScreenTools';
import type { Akapit } from '../data/types';

type ReaderProps = {
  title: string;
  onBack: () => void;
  kickerIcon: string;
  kickerTone?: 'rose' | 'amber' | 'green' | 'blue';
  kickerLabel: string;
  headline: string;
  byline?: React.ReactNode;
  akapity: Akapit[];
  dropcap?: boolean;
  footer?: React.ReactNode;
  loading?: boolean;
};

export function Reader({
  title, onBack, kickerIcon, kickerTone = 'rose',
  kickerLabel, headline, byline, akapity, dropcap, footer, loading,
}: ReaderProps) {
  const vp = useRef<HTMLDivElement>(null);
  return (
    <div className="viewport scroll" ref={vp}>
      <ReadProgress scrollEl={vp} />
      <div className="stage">
        <article className="reader enter enter-1">
          <ScreenTools onBack={onBack} backAriaLabel={title} />
          <div className="reader__kicker">
            <Chip icon={kickerIcon} tone={kickerTone} size={34} />
            <Eyebrow wine={kickerTone === 'rose'}>{kickerLabel}</Eyebrow>
          </div>
          <h1 className="reader__title">{headline}</h1>
          {byline}
          <hr className="reader__rule" />
          {loading ? <Loader /> : <Prose akapity={akapity} dropcap={dropcap} />}
          {footer}
        </article>
      </div>
    </div>
  );
}
