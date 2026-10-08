import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api.js';

/** Fetch an API path with loading/error state and a refetch function. */
export function useApi(path, { skip = false } = {}) {
  const [state, setState] = useState({ data: null, loading: !skip, error: null });
  const [tick, setTick] = useState(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    if (skip) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .get(path)
      .then((data) => alive.current && setState({ data, loading: false, error: null }))
      .catch((error) => alive.current && setState({ data: null, loading: false, error }));
    return () => {
      alive.current = false;
    };
  }, [path, skip, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refetch };
}

export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
