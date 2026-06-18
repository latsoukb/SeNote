import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  newNotebook as createNotebook,
  newPage as createPage,
  newPdfPage as createPdfPage,
  newFolder as createFolder,
  newSection as createSection,
} from '../mock/mock';
import { ensureNotebookSections, notebookHasContent } from '../lib/notebookSections';
import { checkBackend, fetchWorkspace, saveWorkspace as saveWorkspaceApi } from '../lib/api';
import { loadWorkspace, saveWorkspace, getStorageLabel } from '../lib/dataStore';
import {
  syncNotebookPdfsToDrive,
  mergeWithGoogleDrive,
  getDriveStatus,
} from '../lib/googleDriveSync';

const NotesContext = createContext(null);

const emptyTrash = () => ({ notebooks: [], pages: [] });

const migrateNotebook = (nb) =>
  ensureNotebookSections({
    ...nb,
    folderId: nb.folderId ?? null,
    pinned: nb.pinned ?? false,
    pageTemplate: nb.pageTemplate ?? 'seyes',
  });

const mapSection = (nb, sectionId, fn) => {
  const migrated = migrateNotebook(nb);
  return {
    ...migrated,
    sections: migrated.sections.map((s) => (s.id === sectionId ? fn(s) : s)),
    updatedAt: Date.now(),
  };
};

const emptyLibrary = () => ({
  folders: [],
  notebooks: [],
  trash: emptyTrash(),
  savedAt: 0,
});

const defaultData = () => emptyLibrary();

export const NotesProvider = ({ children }) => {
  const [folders, setFolders] = useState([]);
  const [notebooks, setNotebooks] = useState([]);
  const [trash, setTrash] = useState(emptyTrash);
  const [ready, setReady] = useState(false);
  const [driveSyncing, setDriveSyncing] = useState(false);
  const [lastDriveSync, setLastDriveSync] = useState(null);
  const saveTimerRef = useRef(null);
  const driveTimerRef = useRef(null);
  const driveDebounceRef = useRef(null);
  const workspaceRef = useRef({ folders, notebooks, trash });
  const driveSyncInFlightRef = useRef(false);

  const applyWorkspace = useCallback((data) => {
    if (!data) return;
    setFolders((data.folders ?? []).map((f) => ({ ...f, icon: f.icon === 'bag' ? 'bag' : 'folder' })));
    setNotebooks((data.notebooks ?? []).map(migrateNotebook));
    setTrash(data.trash ?? emptyTrash());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = (await loadWorkspace()) || defaultData();
      if (cancelled) return;
      applyWorkspace(local);
      setReady(true);

      // Sync Drive au démarrage (web + APK)
      try {
        const driveStatus = await getDriveStatus();
        if (driveStatus.connected) {
          const merged = await mergeWithGoogleDrive(local);
          if (!cancelled) applyWorkspace(merged);
        }
      } catch (e) {
        console.warn('Sync Drive au démarrage ignorée', e);
      }

      try {
        const online = await checkBackend();
        if (online && !cancelled) {
          const remote = await fetchWorkspace();
          const hasRemote =
            (remote.notebooks?.length || 0) > 0 || (remote.folders?.length || 0) > 0;
          if (hasRemote) {
            applyWorkspace({
              folders: remote.folders ?? [],
              notebooks: (remote.notebooks ?? []).map(migrateNotebook),
              trash: remote.trash ?? emptyTrash(),
              savedAt: Date.now(),
            });
          } else {
            await saveWorkspaceApi({
              folders: local.folders,
              notebooks: local.notebooks,
              trash: local.trash,
            });
          }
        }
      } catch (e) {
        console.warn('Sync backend échouée, mode local', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyWorkspace]);

  useEffect(() => {
    workspaceRef.current = { folders, notebooks, trash };
  }, [folders, notebooks, trash]);

  const isAutoSyncEnabled = useCallback(() => {
    try {
      const raw = localStorage.getItem('senote-settings-v1');
      if (!raw) return true;
      return JSON.parse(raw).googleDriveAutoSync !== false;
    } catch {
      return true;
    }
  }, []);

  const performDriveSync = useCallback(async () => {
    const status = await getDriveStatus();
    if (!status.connected) {
      return { ok: false, error: 'Compte Google Drive non connecté.' };
    }
    if (driveSyncInFlightRef.current) {
      return { ok: false, error: 'Synchronisation déjà en cours…' };
    }

    driveSyncInFlightRef.current = true;
    setDriveSyncing(true);
    try {
      await saveWorkspace(workspaceRef.current);
      const result = await syncNotebookPdfsToDrive(workspaceRef.current);
      setLastDriveSync(Date.now());
      if (!result.count) {
        return {
          ok: false,
          error: 'Aucun cahier à synchroniser. Créez un cahier dans l’app (renommer ou changer le modèle de page suffit).',
        };
      }
      return { ok: true, count: result.count, inFolder: result.inFolder, folderUrl: result.folderUrl };
    } catch (e) {
      console.warn('Sync Google Drive échouée', e);
      return { ok: false, error: e.message || 'Synchronisation impossible' };
    } finally {
      driveSyncInFlightRef.current = false;
      setDriveSyncing(false);
    }
  }, []);

  const flushDriveSync = useCallback(async () => {
    if (!isAutoSyncEnabled()) {
      return { ok: false, error: 'Synchronisation automatique désactivée.' };
    }
    return performDriveSync();
  }, [isAutoSyncEnabled, performDriveSync]);

  const scheduleDriveSync = useCallback(() => {
    if (!isAutoSyncEnabled()) return;
    if (driveDebounceRef.current) clearTimeout(driveDebounceRef.current);
    driveDebounceRef.current = setTimeout(() => {
      flushDriveSync();
    }, 2500);
  }, [isAutoSyncEnabled, flushDriveSync]);

  const persist = useCallback(
    async (payload, syncDrive = false) => {
      const saved = await saveWorkspace(payload);
      try {
        const online = await checkBackend();
        if (online) {
          await saveWorkspaceApi(payload);
        }
      } catch (e) {
        console.warn('Sauvegarde backend échouée', e);
      }
      if (syncDrive) {
        const status = await getDriveStatus();
        if (status.connected) {
          setDriveSyncing(true);
          try {
            await syncNotebookPdfsToDrive(payload);
            setLastDriveSync(Date.now());
          } catch (e) {
            console.warn('Sync Google Drive échouée', e);
          } finally {
            setDriveSyncing(false);
          }
        }
      }
      return saved;
    },
    []
  );

  useEffect(() => {
    if (!ready) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await persist({ folders, notebooks, trash }, false);
      scheduleDriveSync();
    }, 400);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [folders, notebooks, trash, ready, persist, scheduleDriveSync]);

  useEffect(() => {
    if (!ready) return;

    const runDriveSync = () => flushDriveSync();
    driveTimerRef.current = setInterval(runDriveSync, 5 * 60_000);

    const onHide = () => {
      if (driveDebounceRef.current) clearTimeout(driveDebounceRef.current);
      flushDriveSync();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);

    return () => {
      if (driveTimerRef.current) clearInterval(driveTimerRef.current);
      if (driveDebounceRef.current) clearTimeout(driveDebounceRef.current);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
  }, [ready, flushDriveSync]);

  const syncNowToDrive = useCallback(async () => {
    if (driveDebounceRef.current) clearTimeout(driveDebounceRef.current);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await saveWorkspace(workspaceRef.current);
    return performDriveSync();
  }, [performDriveSync]);

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

  const addFolder = useCallback((name, color, icon = 'folder') => {
    const folder = createFolder(name, color, icon);
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

  const addPage = useCallback((notebookId, sectionId, template) => {
    const page = createPage(template);
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId
          ? mapSection(n, sectionId, (s) => ({ ...s, pages: [...s.pages, page] }))
          : n
      )
    );
    return page;
  }, []);

  const insertPageAt = useCallback((notebookId, sectionId, index, template = 'blank') => {
    const page = createPage(template);
    setNotebooks((prev) =>
      prev.map((n) => {
        if (n.id !== notebookId) return n;
        return mapSection(n, sectionId, (s) => {
          const pages = [...s.pages];
          pages.splice(Math.max(0, Math.min(index, pages.length)), 0, page);
          return { ...s, pages };
        });
      })
    );
    return page;
  }, []);

  const importPdfNotebook = useCallback(
    (title, pdfBackgrounds, cover = 'cover-paper', folderId = null) => {
      const nb = {
        id: `nb-${Math.random().toString(36).slice(2, 10)}`,
        title: title || 'Document PDF',
        cover,
        pageTemplate: 'blank',
        sourceType: 'pdf',
        folderId,
        pinned: false,
        sections: [
          {
            id: `sec-${Math.random().toString(36).slice(2, 10)}`,
            title: 'Document',
            pages: pdfBackgrounds.map((bg) => createPdfPage(bg)),
          },
        ],
        updatedAt: Date.now(),
        createdAt: Date.now(),
      };
      setNotebooks((prev) => [nb, ...prev]);
      return nb;
    },
    []
  );

  const appendPdfPagesToNotebook = useCallback((notebookId, sectionId, pdfBackgrounds) => {
    const pages = pdfBackgrounds.map((bg) => createPdfPage(bg));
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId
          ? mapSection(n, sectionId, (s) => ({ ...s, pages: [...s.pages, ...pages] }))
          : n
      )
    );
    return pages;
  }, []);

  const movePageToTrash = useCallback((notebookId, sectionId, pageId) => {
    let entry = null;
    setNotebooks((prev) => {
      const nb = migrateNotebook(prev.find((n) => n.id === notebookId));
      const section = nb?.sections.find((s) => s.id === sectionId);
      const page = section?.pages.find((p) => p.id === pageId);
      if (!nb || !section || !page) return prev;
      entry = {
        id: `${notebookId}-${pageId}`,
        notebookId,
        sectionId,
        notebookTitle: nb.title,
        sectionTitle: section.title,
        page: { ...page },
        deletedAt: Date.now(),
      };
      return prev.map((n) =>
        n.id === notebookId
          ? mapSection(n, sectionId, (s) => ({
              ...s,
              pages: s.pages.filter((p) => p.id !== pageId),
            }))
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
        prev.map((n) => {
          if (n.id !== entry.notebookId) return n;
          const sectionId =
            entry.sectionId && n.sections?.some((s) => s.id === entry.sectionId)
              ? entry.sectionId
              : n.sections?.[0]?.id;
          if (!sectionId) return n;
          return mapSection(n, sectionId, (s) => ({
            ...s,
            pages: [...s.pages, entry.page],
          }));
        })
      );
    }
  }, []);

  const permanentlyDeletePage = useCallback((trashId) => {
    setTrash((t) => ({ ...t, pages: t.pages.filter((p) => p.id !== trashId) }));
  }, []);

  const clearTrash = useCallback(() => {
    setTrash({ notebooks: [], pages: [] });
  }, []);

  const deletePage = useCallback((notebookId, sectionId, pageId) => {
    movePageToTrash(notebookId, sectionId, pageId);
  }, [movePageToTrash]);

  const deleteNotebook = useCallback((id) => {
    moveNotebookToTrash(id);
  }, [moveNotebookToTrash]);

  const updatePage = useCallback((notebookId, sectionId, pageId, patch) => {
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId
          ? mapSection(n, sectionId, (s) => ({
              ...s,
              pages: s.pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p)),
            }))
          : n
      )
    );
  }, []);

  const setPageTemplate = useCallback((notebookId, sectionId, pageId, template) => {
    updatePage(notebookId, sectionId, pageId, { template, pdfBackground: undefined });
  }, [updatePage]);

  const setNotebookTemplate = useCallback((notebookId, template) => {
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId
          ? {
              ...n,
              pageTemplate: template,
              sections: n.sections.map((s) => ({
                ...s,
                pages: s.pages.map((p) =>
                  p.pdfBackground ? p : { ...p, template, pdfBackground: undefined }
                ),
              })),
              updatedAt: Date.now(),
            }
          : n
      )
    );
  }, []);

  const addSection = useCallback((notebookId, title) => {
    const section = createSection(title || `Onglet`, 'blank');
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId
          ? { ...n, sections: [...n.sections, section], updatedAt: Date.now() }
          : n
      )
    );
    return section;
  }, []);

  const updateSection = useCallback((notebookId, sectionId, patch) => {
    setNotebooks((prev) =>
      prev.map((n) =>
        n.id === notebookId
          ? mapSection(n, sectionId, (s) => ({ ...s, ...patch }))
          : n
      )
    );
  }, []);

  const deleteSection = useCallback((notebookId, sectionId) => {
    setNotebooks((prev) =>
      prev.map((n) => {
        if (n.id !== notebookId || n.sections.length <= 1) return n;
        return {
          ...n,
          sections: n.sections.filter((s) => s.id !== sectionId),
          updatedAt: Date.now(),
        };
      })
    );
  }, []);

  const getNotebook = useCallback(
    (id) => notebooks.find((n) => n.id === id),
    [notebooks]
  );

  if (!ready) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-chrome-950">
        <p className="text-slate-500 text-sm">Chargement des cahiers…</p>
      </div>
    );
  }

  return (
    <NotesContext.Provider
      value={{
        folders,
        notebooks,
        trash,
        storageLabel: getStorageLabel(),
        driveSyncing,
        lastDriveSync,
        syncNowToDrive,
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
        insertPageAt,
        importPdfNotebook,
        appendPdfPagesToNotebook,
        deletePage,
        movePageToTrash,
        restorePageFromTrash,
        permanentlyDeletePage,
        emptyTrash: clearTrash,
        updatePage,
        setPageTemplate,
        setNotebookTemplate,
        addSection,
        updateSection,
        deleteSection,
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
