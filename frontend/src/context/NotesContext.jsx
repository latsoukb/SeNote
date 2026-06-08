import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initialNotebooks, newNotebook as createNotebook, newPage as createPage } from '../mock/mock';

const NotesContext = createContext(null);

const STORAGE_KEY = 'senote-data-v1';

export const NotesProvider = ({ children }) => {
  const [notebooks, setNotebooks] = useState(() => {
    if (typeof window === 'undefined') return initialNotebooks;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to load notebooks', e);
    }
    return initialNotebooks;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notebooks));
    } catch (e) {
      console.warn('Failed to save notebooks', e);
    }
  }, [notebooks]);

  const addNotebook = useCallback((title, cover, pageTemplate) => {
    const nb = createNotebook(title, cover, pageTemplate);
    setNotebooks((prev) => [nb, ...prev]);
    return nb;
  }, []);

  const deleteNotebook = useCallback((id) => {
    setNotebooks((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const updateNotebook = useCallback((id, patch) => {
    setNotebooks((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n))
    );
  }, []);

  const addPage = useCallback((notebookId, template) => {
    const page = createPage(template);
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId
          ? { ...n, pages: [...n.pages, page], updatedAt: Date.now() }
          : n
      )
    );
    return page;
  }, []);

  const deletePage = useCallback((notebookId, pageId) => {
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId
          ? { ...n, pages: n.pages.filter((p) => p.id !== pageId), updatedAt: Date.now() }
          : n
      )
    );
  }, []);

  const updatePage = useCallback((notebookId, pageId, patch) => {
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId
          ? {
              ...n,
              pages: n.pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)),
              updatedAt: Date.now(),
            }
          : n
      )
    );
  }, []);

  const getNotebook = useCallback(
    (id) => notebooks.find((n) => n.id === id),
    [notebooks]
  );

  return (
    <NotesContext.Provider
      value={{
        notebooks,
        addNotebook,
        deleteNotebook,
        updateNotebook,
        addPage,
        deletePage,
        updatePage,
        getNotebook,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used inside NotesProvider');
  return ctx;
};
