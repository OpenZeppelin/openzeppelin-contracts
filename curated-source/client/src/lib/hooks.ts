import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

/** Fetches a GET endpoint, re-running when `path` changes. Pass null to skip. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api<T>(path, { signal: ctrl.signal })
      .then((d) => setData(d))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [path, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, error, loading, reload, setData };
}

export function useDebounced<T>(value: T, ms = 220) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onOutside]);
  return ref;
}

export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} — Curated Art`;
  }, [title]);
}
