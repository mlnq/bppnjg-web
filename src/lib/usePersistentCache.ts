import { useEffect, useState } from 'react';

export type CachedSnapshot<T> = {
  savedAt: string;
  data: T;
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function clearPersistentCacheByPrefix(prefix: string, keep?: (key: string) => boolean) {
  if (!canUseStorage()) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      if (keep?.(key)) continue;
      keysToRemove.push(key);
    }
    for (const key of keysToRemove) localStorage.removeItem(key);
  } catch {
    /* ignoruj */
  }
}

export function readPersistentCache<T>(key: string): CachedSnapshot<T> | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSnapshot<T>;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.savedAt !== 'string' || !('data' in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writePersistentCache<T>(key: string, data: T, savedAt = new Date().toISOString()) {
  const snapshot: CachedSnapshot<T> = { savedAt, data };
  if (!canUseStorage()) return snapshot;
  try {
    localStorage.setItem(key, JSON.stringify(snapshot));
  } catch {
    /* quota / tryb prywatny — ignoruj */
  }
  return snapshot;
}

export function removePersistentCache(key: string) {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignoruj */
  }
}

export function makeDailyCacheKey(scope: string, date: string, variant?: string) {
  const parts = ['pg', scope];
  if (variant) parts.push(variant);
  parts.push(date);
  return parts.join('.');
}

export function usePersistentCache<T>(key: string) {
  const [snapshot, setSnapshot] = useState<CachedSnapshot<T> | null>(() => readPersistentCache<T>(key));

  useEffect(() => {
    setSnapshot(readPersistentCache<T>(key));
  }, [key]);

  function reload() {
    const next = readPersistentCache<T>(key);
    setSnapshot(next);
    return next;
  }

  function save(data: T, savedAt?: string) {
    const next = writePersistentCache<T>(key, data, savedAt);
    setSnapshot(next);
    return next;
  }

  function clear() {
    removePersistentCache(key);
    setSnapshot(null);
  }

  return {
    snapshot,
    data: snapshot?.data ?? null,
    savedAt: snapshot?.savedAt ?? null,
    hasValue: snapshot !== null,
    reload,
    save,
    clear,
  };
}
