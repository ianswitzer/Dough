import { useCallback, useEffect, useRef, useState } from 'react';

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-run showing the full loading state (e.g. after a mutation). */
  reload: () => Promise<void>;
  /** Re-run quietly (keeps current data); resolves when done. For pull-to-refresh. */
  refetch: () => Promise<void>;
};

// Minimal data-fetching hook: runs `fn` on mount and whenever `deps` change,
// exposing loading/error/data plus reload/refetch. The latest `fn` is captured
// in a ref so re-runs always use current closures while `deps` decide *when*.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const load = useCallback(
    async (quiet: boolean) => {
      if (!quiet) setLoading(true);
      setError(null);
      try {
        setData(await fnRef.current());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fnRef
      .current()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Something went wrong'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: () => load(false),
    refetch: () => load(true),
  };
}
