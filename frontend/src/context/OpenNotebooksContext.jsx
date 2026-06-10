import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNotes } from './NotesContext';

const STORAGE_KEY = 'senote-open-notebooks';

const OpenNotebooksContext = createContext(null);

export const OpenNotebooksProvider = ({ children }) => {
  const { notebooks } = useNotes();
  const [openIds, setOpenIds] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(openIds));
  }, [openIds]);

  useEffect(() => {
    const valid = new Set(notebooks.map((n) => n.id));
    setOpenIds((prev) => {
      const next = prev.filter((id) => valid.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [notebooks]);

  const openNotebook = useCallback((id) => {
    if (!id) return;
    setOpenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const closeNotebook = useCallback((id) => {
    setOpenIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const value = useMemo(
    () => ({ openIds, openNotebook, closeNotebook }),
    [openIds, openNotebook, closeNotebook]
  );

  return (
    <OpenNotebooksContext.Provider value={value}>{children}</OpenNotebooksContext.Provider>
  );
};

export const useOpenNotebooks = () => {
  const ctx = useContext(OpenNotebooksContext);
  if (!ctx) throw new Error('useOpenNotebooks must be used inside OpenNotebooksProvider');
  return ctx;
};
