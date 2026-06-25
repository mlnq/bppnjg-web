import { useEffect, useState } from 'react';

type ReadProgressProps = { scrollEl: React.RefObject<HTMLElement | null> };

export function ReadProgress({ scrollEl }: ReadProgressProps) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = scrollEl.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setP(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollEl]);
  return <div className="readbar"><div className="readbar__fill" style={{ width: p + '%' }} /></div>;
}
