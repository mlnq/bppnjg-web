import { useEffect, useState } from 'react';

type ProgressProps = {
  pct: number;
  leftLabel?: string;
  rightLabel?: string;
};

export function Progress({ pct, leftLabel, rightLabel }: ProgressProps) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="progress">
      <div className="progress__track">
        <div className="progress__fill" style={{ width: w + '%' }}>
          <span className="progress__pct">{pct}%</span>
        </div>
      </div>
      {(leftLabel || rightLabel) && (
        <div className="progress__labels">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}
