import { useCallback, useEffect, useRef, useState } from 'react';

export const SPEEDS = [0.75, 1, 1.25, 1.5, 2] as const;
export const SPEED_LBL: Record<number, string> = {
  0.75: '0,75×', 1: '1×', 1.25: '1,25×', 1.5: '1,5×', 2: '2×',
};

export function useAudioKonferencja(nr: number, _mp3Url: string, dlugosc = 0) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(dlugosc);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);

  const key = `pg.konf.${nr}`;

  useEffect(() => {
    const saved = Number(localStorage.getItem(key)) || 0;
    setT(saved);
    const el = ref.current;
    if (el) el.currentTime = saved;
    setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nr]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onTime = () => {
      setT(el.currentTime);
      localStorage.setItem(key, String(Math.floor(el.currentTime)));
    };
    const onMeta = () => setDur(el.duration || dlugosc);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => setPlaying(false);
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nr]);

  useEffect(() => { if (ref.current) ref.current.playbackRate = rate; }, [rate]);

  const toggle = useCallback(() => {
    const el = ref.current; if (!el) return;
    el.paused ? el.play() : el.pause();
  }, []);

  const seek = useCallback((sec: number) => {
    const el = ref.current; if (!el) return;
    const max = dur || el.duration || 0;
    el.currentTime = Math.max(0, Math.min(max, sec));
  }, [dur]);

  const skip = useCallback((d: number) => {
    const el = ref.current; if (!el) return;
    seek(el.currentTime + d);
  }, [seek]);

  const restart = useCallback(() => seek(0), [seek]);

  const cycleSpeed = useCallback(() => {
    setRate((r) => SPEEDS[(SPEEDS.indexOf(r as typeof SPEEDS[number]) + 1) % SPEEDS.length]);
  }, []);

  const pct = dur ? Math.min(1, t / dur) : 0;

  return { ref, t, dur, pct, playing, rate, toggle, seek, skip, restart, cycleSpeed };
}
