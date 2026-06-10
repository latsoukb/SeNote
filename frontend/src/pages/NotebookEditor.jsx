import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Moon,
  Sun,
  PanelLeft,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  LayoutTemplate,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import { useSettings } from '../context/SettingsContext';
import { PAGE_TEMPLATES, COVER_TEMPLATES } from '../mock/mock';
import { isPdfPage } from '../lib/pageTemplates';
import Logo from '../components/Logo';
import Toolbar from '../components/Toolbar';
import PdfDocumentView from '../components/PdfDocumentView';
import PageTemplatePreview from '../components/PageTemplatePreview';
import PageLiveThumbnail from '../components/PageLiveThumbnail';
import SettingsDialog from '../components/SettingsDialog';
import OpenNotebookTabBar from '../components/OpenNotebookTabBar';
import { useOpenNotebooks } from '../context/OpenNotebooksContext';
import { getNotebookSections } from '../lib/notebookSections';
import { clampPageIdx } from '../lib/notebookSession';
import { exportNotebookToPdf } from '../lib/exportNotebookPdf';
import { createRuler, createSetSquare, createProtractor } from '../lib/instrumentSnap';
import { clampPan, focalPan } from '../lib/inkEngine';
import {
  loadToolThickness,
  saveToolThickness,
  thicknessForTool,
} from '../lib/toolThickness';
import { loadToolColors, saveToolColors, colorForTool } from '../lib/toolColors';
import { MIN_ZOOM, MAX_ZOOM, DEFAULT_WRITE_ZOOM } from '../components/NoteCanvas';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import { toast } from 'sonner';

const NotebookEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const {
    getNotebook,
    updateNotebook,
    addPage,
    insertPageAt,
    deletePage,
    updatePage,
    setPageTemplate,
    setNotebookTemplate,
  } = useNotes();

  const {
    openNotebook,
    getNotebookSession,
    updateNotebookSession,
    getUndoStacks,
  } = useOpenNotebooks();
  const notebook = getNotebook(id);
  const sections = notebook ? getNotebookSections(notebook) : [];
  const initialSession = id ? getNotebookSession(id) : null;

  useEffect(() => {
    if (id) openNotebook(id);
  }, [id, openNotebook]);

  const [currentPageIdx, setCurrentPageIdx] = useState(
    () => initialSession?.currentPageIdx ?? 0
  );
  const [sidebarOpen, setSidebarOpen] = useState(
    () => initialSession?.sidebarOpen ?? true
  );
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [addPageMode, setAddPageMode] = useState('after'); // end | before | after
  const [notebookTemplateOpen, setNotebookTemplateOpen] = useState(false);
  const [pageTemplateOpen, setPageTemplateOpen] = useState(null);

  const [tool, setTool] = useState('pen');
  const [toolColors, setToolColors] = useState(loadToolColors);
  const [toolThickness, setToolThickness] = useState(loadToolThickness);

  const setColorForActiveTool = useCallback((value) => {
    const key = tool === 'highlighter' ? 'highlighter' : tool === 'text' ? 'text' : 'pen';
    setToolColors((prev) => {
      const next = { ...prev, [key]: value };
      saveToolColors(next);
      return next;
    });
  }, [tool]);

  const color = colorForTool(toolColors, tool);

  const setThicknessForActiveTool = useCallback((value) => {
    setToolThickness((prev) => {
      const next = { ...prev, [tool]: value };
      saveToolThickness(next);
      return next;
    });
  }, [tool]);

  const thickness = thicknessForTool(toolThickness, tool);
  const [writeZoom, setWriteZoom] = useState(
    () => initialSession?.writeZoom ?? DEFAULT_WRITE_ZOOM
  );
  const [writePan, setWritePan] = useState(
    () => initialSession?.writePan ?? { x: 0, y: 0 }
  );

  const undoStackRef = useRef({});
  const redoStackRef = useRef({});
  const [pageSyncRevision, setPageSyncRevision] = useState(
    () => initialSession?.pageSyncRevision ?? 0
  );

  const scrollToPageRef = useRef(null);
  const sessionLiveRef = useRef({});

  const currentSection = sections[0] || null;
  const pages = currentSection?.pages || [];

  sessionLiveRef.current = {
    currentPageIdx,
    writeZoom,
    writePan,
    sidebarOpen,
    pageSyncRevision,
  };

  useEffect(() => {
    if (!id) return;
    const stacks = getUndoStacks(id);
    undoStackRef.current = stacks.undo;
    redoStackRef.current = stacks.redo;

    const session = getNotebookSession(id);
    const pageIdx = clampPageIdx(session.currentPageIdx, pages.length);
    setCurrentPageIdx(pageIdx);
    setWriteZoom(session.writeZoom);
    setWritePan({ ...session.writePan });
    setSidebarOpen(session.sidebarOpen);
    setPageSyncRevision(session.pageSyncRevision ?? 0);
    setEditingTitle(false);
    setAddPageOpen(false);
    setPageTemplateOpen(null);

    const timer = setTimeout(() => {
      scrollToPageRef.current?.(pageIdx, false);
    }, 0);

    return () => {
      clearTimeout(timer);
      updateNotebookSession(id, sessionLiveRef.current);
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!id) return;
    updateNotebookSession(id, sessionLiveRef.current);
  }, [id, currentPageIdx, writeZoom, writePan, sidebarOpen, pageSyncRevision, updateNotebookSession]);

  useEffect(() => {
    if (!id || pages.length === 0) return;
    setCurrentPageIdx((idx) => {
      const clamped = clampPageIdx(idx, pages.length);
      return clamped === idx ? idx : clamped;
    });
  }, [id, pages.length]);

  /** Changement auto (scroll, stylet, ou passage au bord en zoom) */
  const handlePageChange = useCallback((idx, options = {}) => {
    setCurrentPageIdx(idx);
    setWritePan({ x: 0, y: 0 });
    if (options.resetZoom) {
      setWriteZoom(MIN_ZOOM);
    }
  }, []);

  /** Clic miniature sidebar — scroll vers la page */
  const handleSidebarPage = useCallback((idx) => {
    setCurrentPageIdx(idx);
    setWritePan({ x: 0, y: 0 });
    setWriteZoom(DEFAULT_WRITE_ZOOM);
    scrollToPageRef.current?.(idx);
  }, []);

  const handleAutoAddPage = useCallback(
    (template) => {
      if (!notebook || !currentSection) return;
      const newIdx = pages.length;
      addPage(notebook.id, currentSection.id, template);
      setCurrentPageIdx(newIdx);
    },
    [addPage, notebook, currentSection, pages.length]
  );

  const currentPage = pages[currentPageIdx] || pages[0];

  useEffect(() => {
    const blockSafariZoom = (e) => e.preventDefault();
    const blockTrackpadZoom = (e) => {
      if (e.defaultPrevented) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.target?.closest?.('[data-page-viewport]')) return;
      e.preventDefault();
    };
    document.addEventListener('gesturestart', blockSafariZoom, { passive: false });
    document.addEventListener('gesturechange', blockSafariZoom, { passive: false });
    document.addEventListener('gestureend', blockSafariZoom, { passive: false });
    document.addEventListener('wheel', blockTrackpadZoom, { passive: false });
    return () => {
      document.removeEventListener('gesturestart', blockSafariZoom);
      document.removeEventListener('gesturechange', blockSafariZoom);
      document.removeEventListener('gestureend', blockSafariZoom);
      document.removeEventListener('wheel', blockTrackpadZoom);
    };
  }, []);

  if (!notebook) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Cahier introuvable</p>
          <Button asChild>
            <Link to="/">Retour à la bibliothèque</Link>
          </Button>
        </div>
      </div>
    );
  }

  const startEditTitle = () => {
    setTitleDraft(notebook.title);
    setEditingTitle(true);
  };

  const saveTitle = () => {
    const t = titleDraft.trim() || 'Sans titre';
    updateNotebook(notebook.id, { title: t });
    setEditingTitle(false);
  };

  const handleAddPage = (template) => {
    const tpl =
      template ||
      (isPdfPage(currentPage) ? 'blank' : currentPage?.template) ||
      notebook.pageTemplate ||
      'blank';

    if (!currentSection) return;

    if (addPageMode === 'end') {
      addPage(notebook.id, currentSection.id, tpl);
      setCurrentPageIdx(pages.length);
    } else if (addPageMode === 'before') {
      insertPageAt(notebook.id, currentSection.id, currentPageIdx, tpl);
      setCurrentPageIdx(currentPageIdx);
    } else {
      insertPageAt(notebook.id, currentSection.id, currentPageIdx + 1, tpl);
      setCurrentPageIdx(currentPageIdx + 1);
    }

    setAddPageOpen(false);
    toast.success(
      addPageMode === 'before'
        ? 'Page ajoutée avant'
        : addPageMode === 'after'
          ? 'Page ajoutée après'
          : 'Page ajoutée'
    );
  };

  const handleDeletePage = (pageId) => {
    if (!currentSection) return;
    if (pages.length <= 1) {
      toast.error('Vous ne pouvez pas supprimer la dernière page');
      return;
    }
    deletePage(notebook.id, currentSection.id, pageId);
    setCurrentPageIdx((idx) => Math.max(0, idx - 1));
    toast('Page déplacée vers la corbeille');
  };

  const handlePageUpdate = (pageId, patch) => {
    if (!currentSection) return;
    updatePage(notebook.id, currentSection.id, pageId, patch);
  };

  const pushUndo = (pageId, snapshot) => {
    const stack = undoStackRef.current[pageId] || [];
    stack.push(snapshot);
    if (stack.length > 50) stack.shift();
    undoStackRef.current[pageId] = stack;
    redoStackRef.current[pageId] = [];
  };

  const clonePageSnapshot = (page) => ({
    strokes: (page.strokes || []).map((s) => ({
      ...s,
      points: s.points ? s.points.map((p) => ({ ...p })) : s.points,
      shape: s.shape ? { ...s.shape } : s.shape,
    })),
    textBoxes: (page.textBoxes || []).map((t) => ({ ...t })),
    instruments: (page.instruments || []).map((i) => ({ ...i })),
  });

  const handleUndo = () => {
    const stack = undoStackRef.current[currentPage.id] || [];
    if (stack.length === 0) return;
    const prev = stack.pop();
    const redo = redoStackRef.current[currentPage.id] || [];
    redo.push(clonePageSnapshot(currentPage));
    redoStackRef.current[currentPage.id] = redo;
    handlePageUpdate(currentPage.id, clonePageSnapshot(prev));
    setPageSyncRevision((r) => r + 1);
  };

  const handleRedo = () => {
    const redo = redoStackRef.current[currentPage.id] || [];
    if (redo.length === 0) return;
    const next = redo.pop();
    const stack = undoStackRef.current[currentPage.id] || [];
    stack.push(clonePageSnapshot(currentPage));
    undoStackRef.current[currentPage.id] = stack;
    handlePageUpdate(currentPage.id, clonePageSnapshot(next));
    setPageSyncRevision((r) => r + 1);
  };

  const handleClearPage = () => {
    pushUndo(currentPage.id, clonePageSnapshot(currentPage));
    handlePageUpdate(currentPage.id, { strokes: [], textBoxes: [] });
    toast('Page effacée');
  };

  const handleWriteZoomReset = () => {
    setWriteZoom(DEFAULT_WRITE_ZOOM);
    setWritePan({ x: 0, y: 0 });
  };

  const adjustWriteZoom = (delta) => {
    const viewport = document.querySelector('[data-page-viewport]');
    const viewW = viewport?.clientWidth || 700;
    const viewH = viewport?.clientHeight || 990;
    const focalX = viewW / 2;
    const focalY = viewH / 2;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, writeZoom + delta));
    if (next <= MIN_ZOOM) {
      setWriteZoom(MIN_ZOOM);
      setWritePan({ x: 0, y: 0 });
      return;
    }
    const rawPan = focalPan(focalX, focalY, writePan, writeZoom, next);
    setWritePan(clampPan(rawPan, next, viewW, viewH));
    setWriteZoom(next);
  };

  const instrumentsActive = (currentPage?.instruments || []).length > 0;

  const handleAddInstrument = (kind, sizeCm) => {
    pushUndo(currentPage.id, clonePageSnapshot(currentPage));
    const existing = (currentPage.instruments || []).filter((i) => {
      if (kind === 'ruler') return i.type !== 'ruler';
      if (kind === 'setSquare') return i.type !== 'setSquare';
      if (kind === 'protractor') return i.type !== 'protractor';
      return true;
    });
    const inst =
      kind === 'setSquare'
        ? createSetSquare(sizeCm)
        : kind === 'protractor'
          ? createProtractor(sizeCm)
          : createRuler(sizeCm);
    handlePageUpdate(currentPage.id, { instruments: [...existing, inst] });
    setTool('pen');
  };

  const handleExport = async () => {
    try {
      toast.loading('Export PDF…', { id: 'export' });
      await exportNotebookToPdf(notebook);
      toast.success('PDF exporté', { id: 'export' });
    } catch {
      toast.error('Échec de l\'export', { id: 'export' });
    }
  };

  const coverGradient =
    COVER_TEMPLATES.find((c) => c.id === notebook.cover)?.gradient || COVER_TEMPLATES[0].gradient;

  const scrollLabel =
    settings.scrollDirection === 'vertical' ? 'Défilement ↓' : 'Défilement ←';

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <OpenNotebookTabBar activeId={id} />
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-40">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Barre latérale"
          >
            <PanelLeft className="w-5 h-5" />
          </Button>
          <Logo size="sm" />
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
          {editingTitle ? (
            <Input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
              autoFocus
              className="h-8 max-w-xs"
            />
          ) : (
            <button
              onClick={startEditTitle}
              className="font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-md truncate max-w-[30vw]"
            >
              {notebook.title}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            {settings.scrollDirection === 'vertical' ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <ArrowLeftIcon className="w-3 h-3" />
            )}
            {scrollLabel}
          </span>
          <Popover open={addPageOpen} onOpenChange={setAddPageOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs hidden sm:flex">
                <Plus className="w-3.5 h-3.5" />
                Page
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
              <p className="text-xs font-medium text-slate-500 mb-2">Position</p>
              <div className="flex gap-1 mb-3">
                {[
                  { id: 'before', label: 'Avant' },
                  { id: 'after', label: 'Après' },
                  { id: 'end', label: 'À la fin' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setAddPageMode(m.id)}
                    className={`flex-1 text-xs py-1.5 rounded-md border transition-colors ${
                      addPageMode === m.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {addPageMode === 'before' && `Insérer avant la page ${currentPageIdx + 1}`}
                {addPageMode === 'after' && `Insérer après la page ${currentPageIdx + 1}`}
                {addPageMode === 'end' && 'Ajouter à la fin du cahier'}
              </p>
              <p className="text-xs font-medium text-slate-500 mb-2">Modèle vierge</p>
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto thin-scroll pr-1">
                {PAGE_TEMPLATES.map((t) => (
                  <PageTemplatePreview
                    key={t.id}
                    template={t}
                    size="sm"
                    onClick={() => handleAddPage(t.id)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {currentPageIdx + 1} / {pages.length}
          </span>
          <SettingsDialog />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
            aria-label="Changer le thème"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <Toolbar
        tool={tool}
        setTool={setTool}
        toolColors={toolColors}
        setColorForActiveTool={setColorForActiveTool}
        toolThickness={toolThickness}
        setThicknessForActiveTool={setThicknessForActiveTool}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClearPage}
        writeZoom={writeZoom}
        onWriteZoomIn={() => adjustWriteZoom(0.2)}
        onWriteZoomOut={() => adjustWriteZoom(-0.2)}
        onWriteZoomReset={handleWriteZoomReset}
        onAddInstrument={handleAddInstrument}
        instrumentsActive={instrumentsActive}
        onExport={handleExport}
      />

      <div className="flex flex-1 min-h-0">
        {sidebarOpen && (
          <aside className="w-56 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col shrink-0">
            <div className="h-24 cover-shine relative" style={{ background: coverGradient }}>
              <div className="cover-spine" />
              <div className="absolute inset-0 p-3 flex items-end">
                <p className="text-white text-sm font-medium drop-shadow line-clamp-2">
                  {notebook.title}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 gap-1">
              <span className="text-xs uppercase tracking-wide font-medium text-slate-500">
                Pages
              </span>
              <div className="flex items-center gap-0.5">
              <Popover open={notebookTemplateOpen} onOpenChange={setNotebookTemplateOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                    aria-label="Style de page du cahier"
                    title="Appliquer un style à tout le cahier"
                  >
                    <LayoutTemplate className="w-4 h-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <p className="text-xs font-medium text-slate-500 mb-3">Style pour tout le cahier</p>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto thin-scroll pr-1">
                    {PAGE_TEMPLATES.map((t) => (
                      <PageTemplatePreview
                        key={t.id}
                        template={t}
                        size="sm"
                        selected={notebook.pageTemplate === t.id}
                        onClick={() => {
                          setNotebookTemplate(notebook.id, t.id);
                          setNotebookTemplateOpen(false);
                          toast.success(`Style « ${t.name} » appliqué à tout le cahier`);
                        }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <button
                type="button"
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                aria-label="Ajouter une page"
                onClick={() => setAddPageOpen(true)}
              >
                <Plus className="w-4 h-4" />
              </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto thin-scroll p-3 space-y-3">
              {pages.map((p, idx) => (
                <div key={p.id} className="group relative">
                  <button
                    onClick={() => handleSidebarPage(idx)}
                    className={`w-full aspect-[3/4] rounded-md bg-white dark:bg-slate-100 border-2 transition-all overflow-hidden ${
                      idx === currentPageIdx
                        ? 'border-blue-600 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <PageLiveThumbnail page={p} />
                  </button>
                  <p className="text-[11px] text-center mt-1 text-slate-500">{idx + 1}</p>
                  <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isPdfPage(p) ? (
                      <span className="px-1.5 py-0.5 rounded bg-blue-600/90 text-white text-[9px] font-medium">
                        PDF
                      </span>
                    ) : (
                    <Popover
                      open={pageTemplateOpen === p.id}
                      onOpenChange={(open) => setPageTemplateOpen(open ? p.id : null)}
                    >
                      <PopoverTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded bg-white/90 dark:bg-slate-800/90 text-slate-600"
                          aria-label="Changer le style de page"
                          title="Style de cette page"
                        >
                          <LayoutTemplate className="w-3 h-3" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72" onClick={(e) => e.stopPropagation()}>
                        <p className="text-xs font-medium text-slate-500 mb-3">Style de la page {idx + 1}</p>
                        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto thin-scroll pr-1">
                          {PAGE_TEMPLATES.map((t) => (
                            <PageTemplatePreview
                              key={t.id}
                              template={t}
                              size="sm"
                              selected={p.template === t.id}
                              onClick={() => {
                                setPageTemplate(notebook.id, currentSection.id, p.id, t.id);
                                setPageTemplateOpen(null);
                                toast.success(`Page ${idx + 1} : ${t.name}`);
                              }}
                            />
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    )}
                    {pages.length > 1 && (
                      <button
                        onClick={() => handleDeletePage(p.id)}
                        className="p-1 rounded bg-white/90 dark:bg-slate-800/90 text-red-500"
                        aria-label="Supprimer la page"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900 min-w-0 min-h-0">
          <PdfDocumentView
            key={id}
            notebook={notebook}
            pages={pages}
            currentPageIdx={currentPageIdx}
            onPageChange={handlePageChange}
            onRegisterScrollToPage={(fn) => {
              scrollToPageRef.current = fn;
            }}
            scrollDirection={settings.scrollDirection}
            autoAddPage={settings.autoAddPage}
            onAutoAddPage={handleAutoAddPage}
            tool={tool}
            color={color}
            thickness={thickness}
            onPageUpdate={handlePageUpdate}
            pushUndo={pushUndo}
            writeZoom={writeZoom}
            onWriteZoomChange={setWriteZoom}
            writePan={writePan}
            onWritePanChange={setWritePan}
            stylusOnly={settings.stylusOnly !== false}
            pageSyncRevision={pageSyncRevision}
          />
        </div>
      </div>
    </div>
  );
};

export default NotebookEditor;
