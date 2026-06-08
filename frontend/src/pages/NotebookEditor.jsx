import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import { PAGE_TEMPLATES, COVER_TEMPLATES } from '../mock/mock';
import Logo from '../components/Logo';
import Toolbar from '../components/Toolbar';
import NoteCanvas from '../components/NoteCanvas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

const NotebookEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { getNotebook, updateNotebook, addPage, deletePage, updatePage } = useNotes();

  const notebook = getNotebook(id);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Tool state
  const [tool, setTool] = useState('pen'); // pen | highlighter | eraser | text | hand
  const [color, setColor] = useState('#0F172A');
  const [thickness, setThickness] = useState(2.5);

  // Undo/redo stacks per page
  const undoStackRef = useRef({});
  const redoStackRef = useRef({});

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

  const currentPage = notebook.pages[currentPageIdx] || notebook.pages[0];

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
    const p = addPage(notebook.id, template || notebook.pageTemplate);
    setCurrentPageIdx(notebook.pages.length);
    toast.success('Page ajoutée');
    return p;
  };

  const handleDeletePage = (pageId) => {
    if (notebook.pages.length <= 1) {
      toast.error('Vous ne pouvez pas supprimer la dernière page');
      return;
    }
    deletePage(notebook.id, pageId);
    setCurrentPageIdx((idx) => Math.max(0, idx - 1));
    toast('Page supprimée');
  };

  const handleUpdatePage = (patch) => {
    updatePage(notebook.id, currentPage.id, patch);
  };

  const pushUndo = (snapshot) => {
    const stack = undoStackRef.current[currentPage.id] || [];
    stack.push(snapshot);
    if (stack.length > 50) stack.shift();
    undoStackRef.current[currentPage.id] = stack;
    redoStackRef.current[currentPage.id] = [];
  };

  const handleUndo = () => {
    const stack = undoStackRef.current[currentPage.id] || [];
    if (stack.length === 0) return;
    const prev = stack.pop();
    const redo = redoStackRef.current[currentPage.id] || [];
    redo.push({ strokes: currentPage.strokes, textBoxes: currentPage.textBoxes });
    redoStackRef.current[currentPage.id] = redo;
    handleUpdatePage(prev);
  };

  const handleRedo = () => {
    const redo = redoStackRef.current[currentPage.id] || [];
    if (redo.length === 0) return;
    const next = redo.pop();
    const stack = undoStackRef.current[currentPage.id] || [];
    stack.push({ strokes: currentPage.strokes, textBoxes: currentPage.textBoxes });
    undoStackRef.current[currentPage.id] = stack;
    handleUpdatePage(next);
  };

  const handleClearPage = () => {
    pushUndo({ strokes: currentPage.strokes, textBoxes: currentPage.textBoxes });
    handleUpdatePage({ strokes: [], textBoxes: [] });
    toast('Page effacée');
  };

  const coverGradient =
    COVER_TEMPLATES.find((c) => c.id === notebook.cover)?.gradient || COVER_TEMPLATES[0].gradient;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
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
              className="font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded-md truncate max-w-[40vw]"
            >
              {notebook.title}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {currentPageIdx + 1} / {notebook.pages.length}
          </span>
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

      <div className="flex flex-1 min-h-0">
        {/* Pages sidebar */}
        {sidebarOpen && (
          <aside className="w-56 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col">
            <div
              className="h-24 cover-shine relative"
              style={{ background: coverGradient }}
            >
              <div className="cover-spine" />
              <div className="absolute inset-0 p-3 flex items-end">
                <p className="text-white text-sm font-medium drop-shadow line-clamp-2">
                  {notebook.title}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs uppercase tracking-wide font-medium text-slate-500">
                Pages
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                    aria-label="Ajouter une page"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {PAGE_TEMPLATES.map((t) => (
                    <DropdownMenuItem key={t.id} onClick={() => handleAddPage(t.id)}>
                      {t.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex-1 overflow-y-auto thin-scroll p-3 space-y-3">
              {notebook.pages.map((p, idx) => (
                <div key={p.id} className="group relative">
                  <button
                    onClick={() => setCurrentPageIdx(idx)}
                    className={`w-full aspect-[3/4] rounded-md bg-white dark:bg-slate-100 border-2 transition-all overflow-hidden ${
                      idx === currentPageIdx
                        ? 'border-blue-600 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <div
                      className={`w-full h-full ${
                        p.template === 'lined' ? 'paper-lined' : ''
                      } ${p.template === 'grid' ? 'paper-grid' : ''} ${
                        p.template === 'dotted' ? 'paper-dotted' : ''
                      }`}
                    />
                  </button>
                  <p className="text-[11px] text-center mt-1 text-slate-500">{idx + 1}</p>
                  {notebook.pages.length > 1 && (
                    <button
                      onClick={() => handleDeletePage(p.id)}
                      className="absolute top-1 right-1 p-1 rounded bg-white/90 dark:bg-slate-800/90 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Supprimer la page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Canvas area */}
        <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-900 min-w-0">
          <Toolbar
            tool={tool}
            setTool={setTool}
            color={color}
            setColor={setColor}
            thickness={thickness}
            setThickness={setThickness}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClear={handleClearPage}
          />
          <div className="flex-1 overflow-auto thin-scroll flex items-center justify-center p-6 relative">
            <button
              onClick={() => setCurrentPageIdx((i) => Math.max(0, i - 1))}
              disabled={currentPageIdx === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-slate-800 shadow-md disabled:opacity-30 hover:scale-110 transition-transform"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <NoteCanvas
              page={currentPage}
              tool={tool}
              color={color}
              thickness={thickness}
              onChange={handleUpdatePage}
              pushUndo={pushUndo}
            />
            <button
              onClick={() =>
                setCurrentPageIdx((i) => Math.min(notebook.pages.length - 1, i + 1))
              }
              disabled={currentPageIdx === notebook.pages.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white dark:bg-slate-800 shadow-md disabled:opacity-30 hover:scale-110 transition-transform"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotebookEditor;
