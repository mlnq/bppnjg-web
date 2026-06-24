import { useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      /* quota / tryb prywatny — ignoruj */
    }
  }, [key, val]);
  return [val, setVal] as const;
}
