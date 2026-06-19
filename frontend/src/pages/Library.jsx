import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Moon,
  Sun,
  Search,
  Trash2,
  BookOpen,
  MoreVertical,
  Folder,
  FolderPlus,
  Pin,
  PinOff,
  FolderInput,
  ArchiveRestore,
  Trash,
  PanelLeft,
  FileUp,
  Inbox,
  RefreshCw,
  LogOut,
  CalendarClock,
  Backpack,
  ChevronLeft,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Label } from '../components/ui/label';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import { COVER_TEMPLATES, PAGE_TEMPLATES, FOLDER_COLORS, FOLDER_ICONS } from '../mock/mock';
import Logo from '../components/Logo';
import PageTemplatePreview from '../components/PageTemplatePreview';
import { SettingsTrigger } from '../components/TabletShell';
import TabletItAdminDialog from '../components/TabletItAdminDialog';
import { isNativeApp } from '../lib/platform';
import StudentInbox from '../components/StudentInbox';
import StudentLogin from '../components/StudentLogin';
import StudentWaiting from '../components/StudentWaiting';
import StudentDeviceCode from '../components/StudentDeviceCode';
import DeadlineView, { DeadlineSidebarLink } from '../components/DeadlineView';
import { useDeadlineItems } from '../hooks/useDeadlineItems';
import OpenNotebookTabBar from '../components/OpenNotebookTabBar';
import { useStudentClass } from '../context/StudentClassContext';
import { toast } from 'sonner';
import { parsePdfFile } from '../lib/pdfImport';
import { countNotebookPages } from '../lib/notebookSections';

const formatDate = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "à l'instant";
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)} h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const FolderCard = ({ folder, notebookCount, onOpen, onDelete }) => {
  const Icon = folder.icon === 'bag' ? Backpack : Folder;
  return (
    <div className="group fade-up relative">
      <button
        type="button"
        onClick={() => onOpen(folder.id)}
        className="w-full text-left"
        aria-label={`Ouvrir ${folder.name}`}
      >
        <div
          className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 p-4 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-0.5"
          style={{
            background: `${folder.color}18`,
            border: `2px solid ${folder.color}55`,
          }}
        >
          <Icon className="w-11 h-11" style={{ color: folder.color }} strokeWidth={1.75} />
          <span className="font-semibold text-sm text-center line-clamp-2 w-full px-1">
            {folder.name}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {notebookCount} cahier{notebookCount !== 1 ? 's' : ''}
          </span>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(folder.id);
        }}
        className="absolute top-2 right-2 p-1.5 rounded-md text-slate-400 hover:text-red-500 bg-white/80 dark:bg-chrome-900/80 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Supprimer le dossier"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const NotebookCard = ({
  nb,
  getCoverGradient,
  folders,
  onDelete,
  onTogglePin,
  onMoveToFolder,
}) => (
  <div className="group fade-up">
    <Link to={`/notebook/${nb.id}`} className="block relative">
      {nb.pinned && (
        <span className="absolute top-2 right-2 z-10 bg-brand-600 text-white rounded-full p-1 shadow">
          <Pin className="w-3 h-3" />
        </span>
      )}
      <div
        className="relative aspect-[3/4] rounded-md cover-shine shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1"
        style={{ background: getCoverGradient(nb.cover) }}
      >
        <div className="cover-spine" />
        <div className="absolute inset-0 p-5 flex flex-col justify-end">
          <h3 className="text-white font-semibold text-base leading-snug line-clamp-3 drop-shadow">
            {nb.title}
          </h3>
          <p className="text-white/70 text-xs mt-1">
            {countNotebookPages(nb)} page{countNotebookPages(nb) > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </Link>
    <div className="flex items-start justify-between mt-3 px-1">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{nb.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(nb.updatedAt)}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-chrome-800 shrink-0"
            aria-label="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onTogglePin(nb.id)}>
            {nb.pinned ? (
              <>
                <PinOff className="w-4 h-4 mr-2" />
                Retirer le raccourci
              </>
            ) : (
              <>
                <Pin className="w-4 h-4 mr-2" />
                Épingler (raccourci)
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderInput className="w-4 h-4 mr-2" />
              Déplacer vers…
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onMoveToFolder(nb.id, null)}>
                Sans dossier
              </DropdownMenuItem>
              {folders.map((f) => (
                <DropdownMenuItem key={f.id} onClick={() => onMoveToFolder(nb.id, f.id)}>
                  <span
                    className="w-2.5 h-2.5 rounded-full mr-2 shrink-0"
                    style={{ background: f.color }}
                  />
                  {f.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(nb.id, nb.title)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

const navBtnClass = (active) =>
  `w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
    active
      ? 'bg-brand-100 dark:bg-chrome-950 text-brand-700 dark:text-brand-300 font-medium'
      : 'hover:bg-slate-100 dark:hover:bg-chrome-800'
  }`;

const LibrarySidebar = ({
  mainView,
  setMainView,
  newCount,
  studentEnrolled,
  selectedFolder,
  setSelectedFolder,
  trashCount,
  onNavigate,
  className = '',
}) => (
  <div className={`space-y-1 ${className}`}>
    <p className="text-xs uppercase tracking-wide font-medium text-slate-500 px-2 mb-2">
      JokkoNote
    </p>
    <button
      type="button"
      onClick={() => {
        setMainView('inbox');
        onNavigate?.();
      }}
      className={`${navBtnClass(mainView === 'inbox')} justify-between`}
    >
      <span className="flex items-center gap-2">
        <Inbox className="w-4 h-4 shrink-0" />
        Réception
      </span>
      {newCount > 0 && (
        <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold">{newCount}</span>
      )}
    </button>
    {studentEnrolled && (
      <div className="mt-2 mb-1 px-1">
        <StudentDeviceCode />
      </div>
    )}
    <DeadlineSidebarLink
      mainView={mainView}
      setMainView={setMainView}
      onNavigate={onNavigate}
    />
    <div className="h-px bg-slate-200 dark:bg-chrome-800 my-3" />
    <p className="text-xs uppercase tracking-wide font-medium text-slate-500 px-2 mb-3">
      Organisation
    </p>
    <button
      onClick={() => {
        setMainView('library');
        setSelectedFolder('all');
        onNavigate?.();
      }}
      className={navBtnClass(mainView === 'library' && selectedFolder === 'all')}
    >
      <BookOpen className="w-4 h-4 shrink-0" />
      Accueil
    </button>
    <button
      onClick={() => {
        setMainView('library');
        setSelectedFolder('pinned');
        onNavigate?.();
      }}
      className={navBtnClass(mainView === 'library' && selectedFolder === 'pinned')}
    >
      <Pin className="w-4 h-4 shrink-0" />
      Raccourcis
    </button>
    <div className="h-px bg-slate-200 dark:bg-chrome-800 my-3" />
    <button
      onClick={() => {
        setMainView('library');
        setSelectedFolder('trash');
        onNavigate?.();
      }}
      className={`${navBtnClass(mainView === 'library' && selectedFolder === 'trash')} justify-between`}
    >
      <span className="flex items-center gap-2">
        <Trash className="w-4 h-4 shrink-0" />
        Corbeille
      </span>
      {trashCount > 0 && (
        <span className="text-xs bg-slate-200 dark:bg-chrome-700 px-1.5 py-0.5 rounded-full">
          {trashCount}
        </span>
      )}
    </button>
  </div>
);

const Library = () => {
  const navigate = useNavigate();
  const pdfInputRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const {
    session: currentStudent,
    enrolled,
    newCount,
    syncing,
    syncNow,
    logoutStudent,
  } = useStudentClass();
  const {
    folders,
    notebooks,
    trash,
    addNotebook,
    importPdfNotebook,
    deleteNotebook,
    moveNotebookToFolder,
    togglePinNotebook,
    addFolder,
    deleteFolder,
    restoreNotebookFromTrash,
    permanentlyDeleteNotebook,
    restorePageFromTrash,
    permanentlyDeletePage,
    emptyTrash,
  } = useNotes();
  const [itAdminOpen, setItAdminOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const mainView =
    viewParam === 'reception' ? 'inbox' : viewParam === 'echeances' ? 'deadlines' : 'library';

  const setMainView = (view) => {
    if (view === 'inbox') setSearchParams({ view: 'reception' }, { replace: true });
    else if (view === 'deadlines') setSearchParams({ view: 'echeances' }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCover, setNewCover] = useState('cover-blue');
  const [newTemplate, setNewTemplate] = useState('seyes');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [newFolderIcon, setNewFolderIcon] = useState('folder');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setDialogOpen(true);
      const next = {};
      if (searchParams.get('view') === 'reception') next.view = 'reception';
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSync = async () => {
    const { ok, newItems } = await syncNow();
    if (ok && newItems?.length) {
      setMainView('inbox');
    } else if (ok) {
      toast.success('Boîte à jour');
    }
  };

  const getCoverGradient = (coverId) =>
    COVER_TEMPLATES.find((c) => c.id === coverId)?.gradient || COVER_TEMPLATES[0].gradient;

  const folderFilter = (nb) => {
    if (selectedFolder === 'all') return !nb.folderId;
    if (selectedFolder === 'pinned') return nb.pinned;
    return nb.folderId === selectedFolder;
  };

  const currentFolder = folders.find((f) => f.id === selectedFolder) || null;
  const isHomeView = selectedFolder === 'all';
  const looseNotebooks = notebooks.filter((n) => !n.folderId);

  const filtered = notebooks
    .filter(folderFilter)
    .filter((n) => n.title.toLowerCase().includes(search.toLowerCase()));

  const pinnedNotebooks = notebooks.filter((n) => n.pinned);

  const handlePdfImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setPdfImporting(true);
    const toastId = toast.loading('Import du PDF…', { description: file.name });
    try {
      const { title, backgrounds } = await parsePdfFile(file);
      const folderId =
        selectedFolder !== 'all' && selectedFolder !== 'pinned' && selectedFolder !== 'trash'
          ? selectedFolder
          : null;
      const nb = importPdfNotebook(title, backgrounds, 'cover-paper', folderId);
      toast.success('PDF importé', {
        id: toastId,
        description: `${backgrounds.length} page${backgrounds.length > 1 ? 's' : ''} — écrivez par-dessus`,
      });
      navigate(`/notebook/${nb.id}`);
    } catch (err) {
      toast.error(err.message || 'Import impossible', { id: toastId });
    } finally {
      setPdfImporting(false);
    }
  };

  const handleCreate = () => {
    const title = newTitle.trim() || 'Sans titre';
    const folderId =
      selectedFolder !== 'all' && selectedFolder !== 'pinned' && selectedFolder !== 'trash'
        ? selectedFolder
        : null;
    addNotebook(title, newCover, newTemplate, folderId);
    toast.success('Cahier créé', { description: title });
    setNewTitle('');
    setNewCover('cover-blue');
    setNewTemplate('seyes');
    setDialogOpen(false);
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim() || 'Nouveau dossier';
    addFolder(name, newFolderColor, newFolderIcon);
    toast.success('Dossier créé', { description: name });
    setNewFolderName('');
    setNewFolderColor(FOLDER_COLORS[0]);
    setNewFolderIcon('folder');
    setFolderDialogOpen(false);
  };

  const handleDelete = (id, title) => {
    deleteNotebook(id);
    toast('Cahier déplacé vers la corbeille', { description: title });
  };

  const trashCount = (trash?.notebooks?.length || 0) + (trash?.pages?.length || 0);
  const { pendingCount: deadlinePendingCount, items: deadlineItems } = useDeadlineItems();
  const hasDeadlines = deadlinePendingCount > 0;

  const handleMove = (notebookId, folderId) => {
    moveNotebookToFolder(notebookId, folderId);
    toast('Cahier déplacé');
  };

  const handleTogglePin = (id) => {
    togglePinNotebook(id);
    const nb = notebooks.find((n) => n.id === id);
    toast(nb?.pinned ? 'Raccourci retiré' : 'Épinglé en raccourci');
  };

  const cardProps = {
    getCoverGradient,
    folders,
    onDelete: handleDelete,
    onTogglePin: handleTogglePin,
    onMoveToFolder: handleMove,
  };

  const handleDeleteFolder = (id) => {
    deleteFolder(id);
    if (selectedFolder === id) setSelectedFolder('all');
    toast('Dossier supprimé');
  };

  const sidebarProps = {
    mainView,
    setMainView,
    newCount,
    studentEnrolled: Boolean(currentStudent && enrolled),
    selectedFolder,
    setSelectedFolder,
    trashCount,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <OpenNotebookTabBar activeId={null} />
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-chrome-950/80 border-b border-slate-200 dark:border-chrome-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative shrink-0 md:hidden"
                aria-label="Menu organisation"
              >
                <PanelLeft className="w-5 h-5" />
                {deadlinePendingCount > 0 && (
                  <span
                    className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full"
                    title={`${deadlinePendingCount} travail${deadlinePendingCount > 1 ? 'x' : ''} en cours`}
                  />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100vw,280px)] p-4 overflow-y-auto">
              <SheetHeader className="mb-4 text-left">
                <SheetTitle>Organisation</SheetTitle>
              </SheetHeader>
              <LibrarySidebar
                {...sidebarProps}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </SheetContent>
          </Sheet>
          <Logo
            size="md"
            className="shrink-0"
            onItAdminTap={isNativeApp() ? () => setItAdminOpen(true) : undefined}
          />
          <div className="flex-1 min-w-0 max-w-md relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un cahier..."
              className="pl-9 bg-slate-100 dark:bg-chrome-900 border-transparent focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
            {currentStudent && (
              <>
                {enrolled && <StudentDeviceCode variant="chip" />}
                <span className="hidden lg:inline text-xs text-slate-500 max-w-[120px] truncate">
                  {currentStudent.displayName}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-full"
                  onClick={handleSync}
                  disabled={syncing}
                  aria-label="Synchroniser"
                >
                  <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                  {newCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={logoutStudent}
                  className="rounded-full"
                  aria-label="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              aria-label="Changer le thème"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <SettingsTrigger />
          </div>
        </div>
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 bg-slate-100 dark:bg-chrome-900 border-transparent"
            />
          </div>
        </div>
        <div className="md:hidden px-4 pb-3 flex gap-2 overflow-x-auto thin-scroll">
          <button
            type="button"
            onClick={() => setMainView('inbox')}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              mainView === 'inbox'
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white dark:bg-chrome-900 border-slate-200 dark:border-chrome-700'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            Réception
              {newCount > 0 && (
                <span className="bg-red-600 text-white px-1.5 rounded-full text-[10px] font-bold">{newCount}</span>
              )}
          </button>
          {enrolled && hasDeadlines && (
            <button
              type="button"
              onClick={() => setMainView('deadlines')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                mainView === 'deadlines'
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-chrome-900 border-slate-200 dark:border-chrome-700'
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              Échéances
              {deadlinePendingCount > 0 && (
                <span className={`px-1.5 rounded-full text-[10px] font-bold ${
                  mainView === 'deadlines' ? 'bg-white/20 text-white' : 'bg-red-600 text-white'
                }`}>
                  {deadlinePendingCount}
                </span>
              )}
            </button>
          )}
          {mainView === 'library' && [
            { id: 'all', label: 'Accueil', icon: BookOpen },
            { id: 'pinned', label: 'Raccourcis', icon: Pin },
            { id: 'trash', label: 'Corbeille', icon: Trash },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedFolder(id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedFolder === id
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-chrome-900 border-slate-200 dark:border-chrome-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'trash' && trashCount > 0 && (
                <span className="bg-white/20 px-1 rounded text-[10px]">{trashCount}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside className="w-52 shrink-0 border-r border-slate-200 dark:border-chrome-800 p-4 hidden md:block overflow-y-auto max-h-[calc(100vh-8rem)]">
          <LibrarySidebar {...sidebarProps} />
        </aside>

        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 min-w-0 flex flex-col min-h-0">
          {currentStudent && enrolled && mainView === 'library' && (
            <div className="mb-4 md:hidden">
              <StudentDeviceCode />
            </div>
          )}
          {mainView === 'inbox' ? (
            !currentStudent ? (
              <StudentLogin />
            ) : !enrolled ? (
              <StudentWaiting />
            ) : (
              <div className="flex flex-col flex-1 min-h-0 -mx-4 sm:-mx-6 -my-6 sm:-my-10">
                <StudentInbox />
              </div>
            )
          ) : mainView === 'deadlines' ? (
            enrolled ? (
              <DeadlineView />
            ) : (
              <StudentWaiting />
            )
          ) : selectedFolder === 'trash' ? (
            <>
              <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">Corbeille</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {trashCount} élément{trashCount > 1 ? 's' : ''}
                  </p>
                </div>
                {trashCount > 0 && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      emptyTrash();
                      toast('Corbeille vidée');
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Vider la corbeille
                  </Button>
                )}
              </div>
              {trashCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Trash className="w-12 h-12 text-slate-300 mb-4" />
                  <h3 className="font-medium text-lg">Corbeille vide</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Les cahiers et pages supprimés apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-10">
                  {(trash?.notebooks?.length || 0) > 0 && (
                    <section>
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
                        Cahiers
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trash.notebooks.map((nb) => (
                          <div
                            key={nb.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-chrome-800 bg-white dark:bg-chrome-900"
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{nb.title}</p>
                              <p className="text-xs text-slate-500">
                                Supprimé {formatDate(nb.deletedAt)}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0 ml-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  restoreNotebookFromTrash(nb.id);
                                  toast.success('Cahier restauré', { description: nb.title });
                                }}
                                aria-label="Restaurer"
                              >
                                <ArchiveRestore className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  permanentlyDeleteNotebook(nb.id);
                                  toast('Cahier supprimé définitivement');
                                }}
                                aria-label="Supprimer définitivement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                  {(trash?.pages?.length || 0) > 0 && (
                    <section>
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
                        Pages
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trash.pages.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-chrome-800 bg-white dark:bg-chrome-900"
                          >
                            <div className="min-w-0">
                              <p className="font-medium truncate">{entry.notebookTitle}</p>
                              <p className="text-xs text-slate-500">
                                Page · supprimée {formatDate(entry.deletedAt)}
                              </p>
                            </div>
                            <div className="flex gap-1 shrink-0 ml-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  restorePageFromTrash(entry.id);
                                  toast.success('Page restaurée');
                                }}
                                aria-label="Restaurer"
                              >
                                <ArchiveRestore className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  permanentlyDeletePage(entry.id);
                                  toast('Page supprimée définitivement');
                                }}
                                aria-label="Supprimer définitivement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </>
          ) : (
          <>
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <div className="min-w-0">
              {currentFolder && (
                <button
                  type="button"
                  onClick={() => setSelectedFolder('all')}
                  className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 mb-2 hover:underline"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Ma bibliothèque
                </button>
              )}
              <h1 className="text-3xl font-semibold tracking-tight truncate">
                {currentFolder
                  ? currentFolder.name
                  : selectedFolder === 'pinned'
                    ? 'Raccourcis'
                    : 'Ma bibliothèque'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {currentFolder
                  ? `${filtered.length} cahier${filtered.length > 1 ? 's' : ''} dans ce dossier`
                  : isHomeView
                    ? `${folders.length} dossier${folders.length > 1 ? 's' : ''} · ${looseNotebooks.length} cahier${looseNotebooks.length > 1 ? 's' : ''} sans dossier`
                    : `${filtered.length} cahier${filtered.length > 1 ? 's' : ''}`}
              </p>
            </div>

            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handlePdfImport}
            />
            <Button
              variant="outline"
              className="rounded-full px-5 h-11 gap-2"
              disabled={pdfImporting}
              onClick={() => pdfInputRef.current?.click()}
            >
              <FileUp className="w-4 h-4" />
              Importer PDF
            </Button>
            {isHomeView && (
              <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="rounded-full px-5 h-11 gap-2">
                    <FolderPlus className="w-4 h-4" />
                    Nouveau dossier
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Nouveau dossier</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="folder-name">Nom</Label>
                      <Input
                        id="folder-name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Mon dossier"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Icône</Label>
                      <div className="flex gap-2">
                        {FOLDER_ICONS.map(({ id, label }) => {
                          const Icon = id === 'bag' ? Backpack : Folder;
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setNewFolderIcon(id)}
                              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 transition-all ${
                                newFolderIcon === id
                                  ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/30'
                                  : 'border-slate-200 dark:border-chrome-700 hover:border-slate-300'
                              }`}
                            >
                              <Icon className="w-6 h-6" />
                              <span className="text-xs">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur</Label>
                      <div className="flex flex-wrap gap-2">
                        {FOLDER_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewFolderColor(c)}
                            className={`w-8 h-8 rounded-md border-2 transition-transform ${
                              newFolderColor === c
                                ? 'border-slate-900 dark:border-white scale-110'
                                : 'border-transparent'
                            }`}
                            style={{ background: c }}
                            aria-label={`Couleur ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setFolderDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateFolder} className="bg-brand-600 hover:bg-brand-700 text-white">
                      Créer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-brand-600 hover:bg-brand-700 text-white rounded-full px-5 h-11 gap-2">
                  <Plus className="w-4 h-4" />
                  Nouveau cahier
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90dvh] flex flex-col gap-0 p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
                  <DialogTitle>Créer un nouveau cahier</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 px-6 py-2 overflow-y-auto flex-1 min-h-0 thin-scroll">
                  <div className="space-y-2">
                    <Label htmlFor="nb-title">Titre</Label>
                    <Input
                      id="nb-title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Mon cahier"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Couverture</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {COVER_TEMPLATES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setNewCover(c.id)}
                          className={`h-14 sm:h-16 rounded-md cover-shine border-2 transition-all ${
                            newCover === c.id
                              ? 'border-brand-600 scale-105'
                              : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                          style={{ background: c.gradient }}
                          aria-label={c.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Modèle de page</Label>
                    <p className="text-xs text-slate-500">
                      Seyès, quadrillé, millimétré, musique…
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {PAGE_TEMPLATES.map((t) => (
                        <PageTemplatePreview
                          key={t.id}
                          template={t}
                          selected={newTemplate === t.id}
                          onClick={() => setNewTemplate(t.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter className="px-6 py-4 shrink-0 border-t border-slate-200 dark:border-chrome-800 bg-background">
                  <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreate} className="bg-brand-600 hover:bg-brand-700 text-white">
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isHomeView && !search && folders.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
                Dossiers
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-8">
                {folders.map((f) => (
                  <FolderCard
                    key={f.id}
                    folder={f}
                    notebookCount={notebooks.filter((n) => n.folderId === f.id).length}
                    onOpen={(id) => setSelectedFolder(id)}
                    onDelete={handleDeleteFolder}
                  />
                ))}
              </div>
            </section>
          )}

          {isHomeView && !search && folders.length === 0 && (
            <section className="mb-10">
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-chrome-700 p-8 text-center">
                <FolderPlus className="w-8 h-8 mx-auto text-slate-400 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Organisez vos cahiers en dossiers (dossier ou sac à dos, couleur au choix).
                </p>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setFolderDialogOpen(true)}
                >
                  <FolderPlus className="w-4 h-4" />
                  Créer un dossier
                </Button>
              </div>
            </section>
          )}

          {selectedFolder === 'all' && pinnedNotebooks.length > 0 && !search && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4 flex items-center gap-2">
                <Pin className="w-4 h-4" />
                Raccourcis
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                {pinnedNotebooks.map((nb) => (
                  <NotebookCard key={nb.id} nb={nb} {...cardProps} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-chrome-900 flex items-center justify-center mb-4">
                {currentFolder ? (
                  currentFolder.icon === 'bag' ? (
                    <Backpack className="w-7 h-7 text-slate-400" />
                  ) : (
                    <Folder className="w-7 h-7 text-slate-400" />
                  )
                ) : (
                  <BookOpen className="w-7 h-7 text-slate-400" />
                )}
              </div>
              <h3 className="font-medium text-lg">
                {currentFolder ? 'Dossier vide' : 'Aucun cahier'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {currentFolder
                  ? 'Créez un cahier dans ce dossier pour commencer.'
                  : 'Créez votre premier cahier ou importez un PDF.'}
              </p>
            </div>
          ) : (
            <>
              {isHomeView && !search && (
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
                  Cahiers
                </h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                {filtered.map((nb) => (
                  <NotebookCard key={nb.id} nb={nb} {...cardProps} />
                ))}
              </div>
            </>
          )}
          </>
          )}
        </main>
      </div>
      <TabletItAdminDialog open={itAdminOpen} onOpenChange={setItAdminOpen} />
    </div>
  );
};

export default Library;
