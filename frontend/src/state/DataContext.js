import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);

  const fetchItems = useCallback(async ({signal, limit = 20}) => {
    try {
      const res = await fetch(`http://localhost:3001/api/items?limit=${limit}`, {
        signal,
      });
      const json = await res.json();
      setItems(json);
    } catch (err) {
      if (err.name !== 'AbortError') {
        throw err;
      }
    }
  }, []);

  return (
    <DataContext.Provider value={{ items, fetchItems }}>
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
