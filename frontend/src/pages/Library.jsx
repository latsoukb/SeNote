import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
import { COVER_TEMPLATES, PAGE_TEMPLATES, FOLDER_COLORS } from '../mock/mock';
import Logo from '../components/Logo';
import PageTemplatePreview from '../components/PageTemplatePreview';
import SettingsDialog from '../components/SettingsDialog';
import { toast } from 'sonner';

const formatDate = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "à l'instant";
  if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)} h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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
        <span className="absolute top-2 right-2 z-10 bg-blue-600 text-white rounded-full p-1 shadow">
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
            {nb.pages.length} page{nb.pages.length > 1 ? 's' : ''}
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
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
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
      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium'
      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
  }`;

const LibrarySidebar = ({
  selectedFolder,
  setSelectedFolder,
  folders,
  trashCount,
  folderDialogOpen,
  setFolderDialogOpen,
  newFolderName,
  setNewFolderName,
  newFolderColor,
  setNewFolderColor,
  onCreateFolder,
  onDeleteFolder,
  onNavigate,
  className = '',
}) => (
  <div className={`space-y-1 ${className}`}>
    <p className="text-xs uppercase tracking-wide font-medium text-slate-500 px-2 mb-3">
      Organisation
    </p>
    <button
      onClick={() => {
        setSelectedFolder('all');
        onNavigate?.();
      }}
      className={navBtnClass(selectedFolder === 'all')}
    >
      <BookOpen className="w-4 h-4 shrink-0" />
      Tous les cahiers
    </button>
    <button
      onClick={() => {
        setSelectedFolder('pinned');
        onNavigate?.();
      }}
      className={navBtnClass(selectedFolder === 'pinned')}
    >
      <Pin className="w-4 h-4 shrink-0" />
      Raccourcis
    </button>
    <button
      onClick={() => {
        setSelectedFolder('none');
        onNavigate?.();
      }}
      className={navBtnClass(selectedFolder === 'none')}
    >
      <Folder className="w-4 h-4 shrink-0 opacity-50" />
      Sans dossier
    </button>
    <div className="h-px bg-slate-200 dark:bg-slate-800 my-3" />
    <button
      onClick={() => {
        setSelectedFolder('trash');
        onNavigate?.();
      }}
      className={`${navBtnClass(selectedFolder === 'trash')} justify-between`}
    >
      <span className="flex items-center gap-2">
        <Trash className="w-4 h-4 shrink-0" />
        Corbeille
      </span>
      {trashCount > 0 && (
        <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
          {trashCount}
        </span>
      )}
    </button>
    <div className="h-px bg-slate-200 dark:bg-slate-800 my-3" />
    <p className="text-xs uppercase tracking-wide font-medium text-slate-500 px-2 mb-2">
      Dossiers
    </p>
    {folders.map((f) => (
      <div key={f.id} className="group flex items-center">
        <button
          onClick={() => {
            setSelectedFolder(f.id);
            onNavigate?.();
          }}
          className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors truncate ${navBtnClass(selectedFolder === f.id)}`}
        >
          <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: f.color }} />
          <span className="truncate">{f.name}</span>
        </button>
        <button
          onClick={() => {
            onDeleteFolder(f.id);
            onNavigate?.();
          }}
          className="p-2 text-slate-400 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          aria-label="Supprimer le dossier"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
    <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 mt-1">
          <FolderPlus className="w-4 h-4" />
          Nouveau dossier
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nouveau dossier</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="folder-name-m">Nom</Label>
            <Input
              id="folder-name-m"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Mon dossier"
            />
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
                    newFolderColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent'
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
          <Button onClick={onCreateFolder} className="bg-blue-600 hover:bg-blue-700 text-white">
            Créer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
);

const Library = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    folders,
    notebooks,
    trash,
    addNotebook,
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCover, setNewCover] = useState('cover-blue');
  const [newTemplate, setNewTemplate] = useState('seyes');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const getCoverGradient = (coverId) =>
    COVER_TEMPLATES.find((c) => c.id === coverId)?.gradient || COVER_TEMPLATES[0].gradient;

  const folderFilter = (nb) => {
    if (selectedFolder === 'all') return true;
    if (selectedFolder === 'pinned') return nb.pinned;
    if (selectedFolder === 'none') return !nb.folderId;
    return nb.folderId === selectedFolder;
  };

  const filtered = notebooks
    .filter(folderFilter)
    .filter((n) => n.title.toLowerCase().includes(search.toLowerCase()));

  const pinnedNotebooks = notebooks.filter((n) => n.pinned);

  const handleCreate = () => {
    const title = newTitle.trim() || 'Sans titre';
    const folderId = selectedFolder !== 'all' && selectedFolder !== 'pinned' && selectedFolder !== 'none'
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
    addFolder(name, newFolderColor);
    toast.success('Dossier créé', { description: name });
    setNewFolderName('');
    setNewFolderColor(FOLDER_COLORS[0]);
    setFolderDialogOpen(false);
  };

  const handleDelete = (id, title) => {
    deleteNotebook(id);
    toast('Cahier déplacé vers la corbeille', { description: title });
  };

  const trashCount = (trash?.notebooks?.length || 0) + (trash?.pages?.length || 0);

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
    selectedFolder,
    setSelectedFolder,
    folders,
    trashCount,
    folderDialogOpen,
    setFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    newFolderColor,
    setNewFolderColor,
    onCreateFolder: handleCreateFolder,
    onDeleteFolder: handleDeleteFolder,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 md:hidden"
                aria-label="Menu organisation"
              >
                <PanelLeft className="w-5 h-5" />
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
          <Logo size="md" className="shrink-0" />
          <div className="flex-1 min-w-0 max-w-md relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un cahier..."
              className="pl-9 bg-slate-100 dark:bg-slate-900 border-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              aria-label="Changer le thème"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <SettingsDialog />
          </div>
        </div>
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 bg-slate-100 dark:bg-slate-900 border-transparent"
            />
          </div>
        </div>
        <div className="md:hidden px-4 pb-3 flex gap-2 overflow-x-auto thin-scroll">
          {[
            { id: 'all', label: 'Tous', icon: BookOpen },
            { id: 'pinned', label: 'Raccourcis', icon: Pin },
            { id: 'trash', label: 'Corbeille', icon: Trash },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedFolder(id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedFolder === id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'trash' && trashCount > 0 && (
                <span className="bg-white/20 px-1 rounded text-[10px]">{trashCount}</span>
              )}
            </button>
          ))}
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedFolder === f.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: f.color }} />
              {f.name}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        <aside className="w-52 shrink-0 border-r border-slate-200 dark:border-slate-800 p-4 hidden md:block">
          <LibrarySidebar {...sidebarProps} />
        </aside>

        <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 min-w-0">
          {selectedFolder === 'trash' ? (
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
                            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
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
                            className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
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
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Ma bibliothèque</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                {filtered.length} cahier{filtered.length > 1 ? 's' : ''}
              </p>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 h-11 gap-2">
                  <Plus className="w-4 h-4" />
                  Nouveau cahier
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer un nouveau cahier</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-2">
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
                          className={`h-16 rounded-md cover-shine border-2 transition-all ${
                            newCover === c.id
                              ? 'border-blue-600 scale-105'
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
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

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
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-slate-400" />
              </div>
              <h3 className="font-medium text-lg">Aucun cahier</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Créez votre premier cahier pour commencer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
              {filtered.map((nb) => (
                <NotebookCard key={nb.id} nb={nb} {...cardProps} />
              ))}
            </div>
          )}
          </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Library;
