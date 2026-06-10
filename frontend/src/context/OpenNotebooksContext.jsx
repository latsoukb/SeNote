import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNotes } from './NotesContext';
import { createNotebookSession } from '../lib/notebookSession';

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

  const sessionsRef = useRef({});
  const undoStacksRef = useRef({});

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(openIds));
  }, [openIds]);

  useEffect(() => {
    const valid = new Set(notebooks.map((n) => n.id));
    setOpenIds((prev) => {
      const next = prev.filter((id) => valid.has(id));
      return next.length === prev.length ? prev : next;
    });
    Object.keys(sessionsRef.current).forEach((id) => {
      if (!valid.has(id)) {
        delete sessionsRef.current[id];
        delete undoStacksRef.current[id];
      }
    });
  }, [notebooks]);

  const getNotebookSession = useCallback((notebookId) => {
    if (!notebookId) return createNotebookSession();
    if (!sessionsRef.current[notebookId]) {
      sessionsRef.current[notebookId] = createNotebookSession();
    }
    return sessionsRef.current[notebookId];
  }, []);

  const updateNotebookSession = useCallback((notebookId, patch) => {
    if (!notebookId) return;
    const prev = getNotebookSession(notebookId);
    sessionsRef.current[notebookId] = {
      ...prev,
      ...patch,
      writePan: patch.writePan ? { ...patch.writePan } : prev.writePan,
    };
  }, [getNotebookSession]);

  const clearNotebookSession = useCallback((notebookId) => {
    delete sessionsRef.current[notebookId];
    delete undoStacksRef.current[notebookId];
  }, []);

  const getUndoStacks = useCallback((notebookId) => {
    if (!notebookId) return { undo: {}, redo: {} };
    if (!undoStacksRef.current[notebookId]) {
      undoStacksRef.current[notebookId] = { undo: {}, redo: {} };
    }
    return undoStacksRef.current[notebookId];
  }, []);

  const openNotebook = useCallback((id) => {
    if (!id) return;
    setOpenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const closeNotebook = useCallback((id) => {
    clearNotebookSession(id);
    setOpenIds((prev) => prev.filter((x) => x !== id));
  }, [clearNotebookSession]);

  const value = useMemo(
    () => ({
      openIds,
      openNotebook,
      closeNotebook,
      getNotebookSession,
      updateNotebookSession,
      clearNotebookSession,
      getUndoStacks,
    }),
    [
      openIds,
      openNotebook,
      closeNotebook,
      getNotebookSession,
      updateNotebookSession,
      clearNotebookSession,
      getUndoStacks,
    ]
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
