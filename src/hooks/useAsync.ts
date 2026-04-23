/**
 * useAsync — the one hook for "load/refresh data with loading + error + retry".
 *
 * Handles:
 *   - `idle` / `loading` / `success` / `error` state transitions
 *   - Abort on unmount (never setState on unmounted components)
 *   - `retry()` and `refresh()` callbacks
 *   - Optional `immediate` (default true) — skip if you want to trigger manually
 *
 * Example:
 *   const { data, loading, error, retry } = useAsync(
 *     () => api.post<Reply>('/api/scholar', body),
 *     [body],
 *   );
 *   if (loading) return <LoadingState />;
 *   if (error)   return <FallbackView error={error} onRetry={retry} />;
 *   return <ScholarReply reply={data.reply} />;
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncState<T> =
  | { status: 'idle'; data: undefined; error: undefined; loading: false }
  | { status: 'loading'; data: T | undefined; error: undefined; loading: true }
  | { status: 'success'; data: T; error: undefined; loading: false }
  | { status: 'error'; data: undefined; error: unknown; loading: false };

export interface UseAsyncOptions {
  immediate?: boolean;
}

export interface UseAsyncResult<T> {
  status: AsyncState<T>['status'];
  data: T | undefined;
  error: unknown;
  loading: boolean;
  retry: () => void;
  refresh: () => void;
}

export function useAsync<T>(
  factory: (signal: AbortSignal) => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
  opts: UseAsyncOptions = {}
): UseAsyncResult<T> {
  const immediate = opts.immediate ?? true;
  const [state, setState] = useState<AsyncState<T>>({
    status: immediate ? 'loading' : 'idle',
    data: undefined,
    error: undefined,
    loading: immediate,
  } as AsyncState<T>);

  const alive = useRef(true);
  const ctrlRef = useRef<AbortController | null>(null);

  const run = useCallback(() => {
    // Cancel any in-flight request.
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setState((s) => ({
      status: 'loading',
      data: s.status === 'success' ? s.data : undefined,
      error: undefined,
      loading: true,
    } as AsyncState<T>));

    factory(ctrl.signal)
      .then((data) => {
        if (!alive.current || ctrl.signal.aborted) return;
        setState({ status: 'success', data, error: undefined, loading: false });
      })
      .catch((error) => {
        if (!alive.current || ctrl.signal.aborted) return;
        setState({ status: 'error', data: undefined, error, loading: false });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    alive.current = true;
    if (immediate) run();
    return () => {
      alive.current = false;
      ctrlRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    loading: state.loading,
    retry: run,
    refresh: run,
  };
}
