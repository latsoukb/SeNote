import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  initialNotebooks,
  initialFolders,
  newNotebook as createNotebook,
  newPage as createPage,
  newFolder as createFolder,
} from '../mock/mock';
import { checkBackend, fetchWorkspace, saveWorkspace } from '../lib/api';

const NotesContext = createContext(null);

const STORAGE_KEY = 'senote-data-v3';
const LEGACY_KEYS = ['senote-data-v2', 'senote-data-v1'];

const emptyTrash = () => ({ notebooks: [], pages: [] });

const migrateNotebook = (nb) => ({
  ...nb,
  folderId: nb.folderId ?? null,
  pinned: nb.pinned ?? false,
  pageTemplate: nb.pageTemplate ?? 'seyes',
});

const loadData = () => {
  if (typeof window === 'undefined') {
    return { folders: initialFolders, notebooks: initialNotebooks, trash: emptyTrash() };
  }
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const key of LEGACY_KEYS) {
        raw = localStorage.getItem(key);
        if (raw) break;
      }
      if (raw) {
        const data = JSON.parse(raw);
        return {
          folders: data.folders ?? initialFolders,
          notebooks: (data.notebooks ?? []).map(migrateNotebook),
          trash: data.trash ?? emptyTrash(),
        };
      }
    }
    if (raw) {
      const data = JSON.parse(raw);
      return {
        folders: data.folders ?? initialFolders,
        notebooks: (data.notebooks ?? []).map(migrateNotebook),
        trash: data.trash ?? emptyTrash(),
      };
    }
  } catch (e) {
    console.warn('Failed to load notebooks', e);
  }
  return { folders: initialFolders, notebooks: initialNotebooks, trash: emptyTrash() };
};

export const NotesProvider = ({ children }) => {
  const [folders, setFolders] = useState(() => loadData().folders);
  const [notebooks, setNotebooks] = useState(() => loadData().notebooks);
  const [trash, setTrash] = useState(() => loadData().trash);
  const [synced, setSynced] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const online = await checkBackend();
      if (cancelled) return;
      if (online) {
        try {
          const remote = await fetchWorkspace();
          const hasRemote =
            (remote.notebooks?.length || 0) > 0 || (remote.folders?.length || 0) > 0;
          if (hasRemote) {
            setFolders(remote.folders ?? initialFolders);
            setNotebooks((remote.notebooks ?? []).map(migrateNotebook));
            setTrash(remote.trash ?? emptyTrash());
          } else {
            const local = loadData();
            await saveWorkspace({ folders: local.folders, notebooks: local.notebooks, trash: local.trash });
          }
        } catch (e) {
          console.warn('Sync backend échouée, mode local', e);
        }
      }
      if (!cancelled) setSynced(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!synced) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ folders, notebooks, trash }));
    } catch (e) {
      console.warn('Failed to save notebooks', e);
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const online = await checkBackend();
        if (online) {
          await saveWorkspace({ folders, notebooks, trash });
        }
      } catch (e) {
        console.warn('Sauvegarde backend échouée', e);
      }
    }, 600);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [folders, notebooks, trash, synced]);

  const addNotebook = useCallback((title, cover, pageTemplate, folderId = null) => {
    const nb = createNotebook(title, cover, pageTemplate, folderId);
    setNotebooks((prev) => [nb, ...prev]);
    return nb;
  }, []);

  const moveNotebookToTrash = useCallback((id) => {
    let entry = null;
    setNotebooks((prev) => {
      const nb = prev.find((n) => n.id === id);
      if (!nb) return prev;
      entry = { ...nb, deletedAt: Date.now() };
      return prev.filter((n) => n.id !== id);
    });
    if (entry) {
      setTrash((t) => ({
        ...t,
        notebooks: [entry, ...(t.notebooks || []).filter((x) => x.id !== id)],
      }));
    }
  }, []);

  const restoreNotebookFromTrash = useCallback((id) => {
    let restored = null;
    setTrash((t) => {
      const entry = t.notebooks.find((n) => n.id === id);
      if (!entry) return t;
      const { deletedAt, ...nb } = entry;
      restored = migrateNotebook(nb);
      return { ...t, notebooks: t.notebooks.filter((n) => n.id !== id) };
    });
    if (restored) {
      setNotebooks((prev) => [restored, ...prev]);
    }
  }, []);

  const permanentlyDeleteNotebook = useCallback((id) => {
    setTrash((t) => ({ ...t, notebooks: t.notebooks.filter((n) => n.id !== id) }));
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

  const movePageToTrash = useCallback((notebookId, pageId) => {
    let entry = null;
    setNotebooks((prev) => {
      const nb = prev.find((n) => n.id === notebookId);
      const page = nb?.pages.find((p) => p.id === pageId);
      if (!nb || !page) return prev;
      entry = {
        id: `${notebookId}-${pageId}`,
        notebookId,
        notebookTitle: nb.title,
        page: { ...page },
        deletedAt: Date.now(),
      };
      return prev.map((n) =>
        n.id === notebookId
          ? { ...n, pages: n.pages.filter((p) => p.id !== pageId), updatedAt: Date.now() }
          : n
      );
    });
    if (entry) {
      setTrash((t) => ({
        ...t,
        pages: [entry, ...(t.pages || []).filter((x) => x.id !== entry.id)],
      }));
    }
  }, []);

  const restorePageFromTrash = useCallback((trashId) => {
    let entry = null;
    setTrash((t) => {
      const found = t.pages.find((p) => p.id === trashId);
      if (!found) return t;
      entry = found;
      return { ...t, pages: t.pages.filter((p) => p.id !== trashId) };
    });
    if (entry) {
      setNotebooks((prev) =>
        prev.map((n) =>
          n.id === entry.notebookId
            ? { ...n, pages: [...n.pages, entry.page], updatedAt: Date.now() }
            : n
        )
      );
    }
  }, []);

  const permanentlyDeletePage = useCallback((trashId) => {
    setTrash((t) => ({ ...t, pages: t.pages.filter((p) => p.id !== trashId) }));
  }, []);

  const clearTrash = useCallback(() => {
    setTrash({ notebooks: [], pages: [] });
  }, []);

  const deletePage = useCallback((notebookId, pageId) => {
    movePageToTrash(notebookId, pageId);
  }, [movePageToTrash]);

  const deleteNotebook = useCallback((id) => {
    moveNotebookToTrash(id);
  }, [moveNotebookToTrash]);

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

  const setPageTemplate = useCallback((notebookId, pageId, template) => {
    updatePage(notebookId, pageId, { template });
  }, [updatePage]);

  const setNotebookTemplate = useCallback((notebookId, template) => {
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId
          ? {
              ...n,
              pageTemplate: template,
              pages: n.pages.map((p) => ({ ...p, template })),
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
        trash,
        addNotebook,
        deleteNotebook,
        moveNotebookToTrash,
        restoreNotebookFromTrash,
        permanentlyDeleteNotebook,
        updateNotebook,
        moveNotebookToFolder,
        togglePinNotebook,
        addFolder,
        updateFolder,
        deleteFolder,
        addPage,
        deletePage,
        movePageToTrash,
        restorePageFromTrash,
        permanentlyDeletePage,
        emptyTrash: clearTrash,
        updatePage,
        setPageTemplate,
        setNotebookTemplate,
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
