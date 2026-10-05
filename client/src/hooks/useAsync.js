import { useEffect, useState } from 'react';

export function useAsync(task, dependencies = []) {
  const [state, setState] = useState({ data: undefined, loading: true, error: '' });
  const [reloadIndex, setReloadIndex] = useState(0);

  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: '' }));
    Promise.resolve().then(task).then(
      (data) => { if (active) setState({ data, loading: false, error: '' }); },
      (error) => { if (active) setState({ data: undefined, loading: false, error: error.message || 'Something went wrong.' }); },
    );
    return () => { active = false; };
  // Callers pass stable scalar dependencies; task intentionally stays inline.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, reloadIndex]);

  return { ...state, reload: () => setReloadIndex((current) => current + 1) };
}
