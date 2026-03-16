import { createContext, useCallback, useContext, useReducer } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {

  const [state, setState] = useReducer((prev, curr) => {
    return { ...prev, ...curr }
  }, { items: [], total: 0, totalPages: 1, loading: false, error: null })

  const fetchItems = useCallback(async ({ signal, page: nextPage = 1, limit: nextLimit = 20, q = '' } = {}) => {
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: String(nextLimit)
    });

    if (q.trim()) {
      params.set('q', q.trim());
    }

    setState({ loading: true, error: null });

    try {
      const res = await fetch(`http://localhost:3001/api/items?${params.toString()}`, {
        signal,
      });

      if (!res.ok) {
        throw new Error('Failed to fetch items');
      }

      const json = await res.json();
      setState({ items: json.items, total: json.total, totalPages: json.totalPages });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setState({ error: err.message });
        throw err;
      }
    } finally {
      setState({ loading: false });
    }
  }, []);

  return (
    <DataContext.Provider
      value={{ ...state, fetchItems }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
