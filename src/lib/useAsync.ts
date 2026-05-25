import { useCallback, useEffect, useState } from 'react';

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

// Minimal data-fetching hook: runs `fn` on mount and whenever `deps` change,
// exposing loading/error/data plus a manual reload. Keeps screens free of
// repeated useEffect/try-catch boilerplate without pulling in a query library.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // fn identity changes every render; we intentionally key off caller deps.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    run()
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e?.message ?? 'Something went wrong'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [run, nonce]);

  return { data, loading, error, reload: () => setNonce((n) => n + 1) };
}
