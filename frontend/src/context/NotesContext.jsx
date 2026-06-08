import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initialNotebooks,
  initialFolders,
  newNotebook as createNotebook,
  newPage as createPage,
  newFolder as createFolder,
} from '../mock/mock';

const NotesContext = createContext(null);

const STORAGE_KEY = 'senote-data-v2';
const LEGACY_KEY = 'senote-data-v1';

const migrateNotebook = (nb) => ({
  ...nb,
  folderId: nb.folderId ?? null,
  pinned: nb.pinned ?? false,
  pageTemplate: nb.pageTemplate ?? 'seyes',
});

const loadData = () => {
  if (typeof window === 'undefined') {
    return { folders: initialFolders, notebooks: initialNotebooks };
  }
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY);
      if (raw) {
        const notebooks = JSON.parse(raw).map(migrateNotebook);
        return { folders: initialFolders, notebooks };
      }
    }
    if (raw) {
      const data = JSON.parse(raw);
      return {
        folders: data.folders ?? initialFolders,
        notebooks: (data.notebooks ?? []).map(migrateNotebook),
      };
    }
  } catch (e) {
    console.warn('Failed to load notebooks', e);
  }
  return { folders: initialFolders, notebooks: initialNotebooks };
};

export const NotesProvider = ({ children }) => {
  const [folders, setFolders] = useState(() => loadData().folders);
  const [notebooks, setNotebooks] = useState(() => loadData().notebooks);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders, notebooks }));
    } catch (e) {
      console.warn('Failed to save notebooks', e);
    }
  }, [folders, notebooks]);

  const addNotebook = useCallback((title, cover, pageTemplate, folderId = null) => {
    const nb = createNotebook(title, cover, pageTemplate, folderId);
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

  const moveNotebookToFolder = useCallback((notebookId, folderId) => {
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId ? { ...n, folderId, updatedAt: Date.now() } : n
      )
    );
  }, []);

  const togglePinNotebook = useCallback((id) => {
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n
      )
    );
  }, []);

  const addFolder = useCallback((name, color) => {
    const folder = createFolder(name, color);
    setFolders((prev) => [...prev, folder]);
    return folder;
  }, []);

  const updateFolder = useCallback((id, patch) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const deleteFolder = useCallback((id) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setNotebooks((prev) =>
      prev.map((n) => (n.folderId === id ? { ...n, folderId: null } : n))
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
        folders,
        notebooks,
        addNotebook,
        deleteNotebook,
        updateNotebook,
        moveNotebookToFolder,
        togglePinNotebook,
        addFolder,
        updateFolder,
        deleteFolder,
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
