import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Moon, Sun, Search, Trash2, BookOpen, Settings, MoreVertical } from 'lucide-react';
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
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Label } from '../components/ui/label';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import { COVER_TEMPLATES, PAGE_TEMPLATES } from '../mock/mock';
import Logo from '../components/Logo';
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

const Library = () => {
  const { theme, toggleTheme } = useTheme();
  const { notebooks, addNotebook, deleteNotebook } = useNotes();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCover, setNewCover] = useState('cover-blue');
  const [newTemplate, setNewTemplate] = useState('lined');

  const filtered = notebooks.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    const title = newTitle.trim() || 'Sans titre';
    addNotebook(title, newCover, newTemplate);
    toast.success('Cahier créé', { description: title });
    setNewTitle('');
    setNewCover('cover-blue');
    setNewTemplate('lined');
    setDialogOpen(false);
  };

  const handleDelete = (id, title) => {
    deleteNotebook(id);
    toast('Cahier supprimé', { description: title });
  };

  const getCoverGradient = (coverId) =>
    COVER_TEMPLATES.find((c) => c.id === coverId)?.gradient || COVER_TEMPLATES[0].gradient;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Logo size="md" />
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un cahier..."
              className="pl-9 bg-slate-100 dark:bg-slate-900 border-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              aria-label="Changer le thème"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Paramètres">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Ma bibliothèque</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {notebooks.length} cahier{notebooks.length > 1 ? 's' : ''}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 h-11 gap-2">
                <Plus className="w-4 h-4" />
                Nouveau cahier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
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
                  <div className="grid grid-cols-4 gap-2">
                    {PAGE_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNewTemplate(t.id)}
                        className={`py-2.5 rounded-md text-sm font-medium border transition-colors ${
                          newTemplate === t.id
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleCreate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

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
              <div key={nb.id} className="group fade-up">
                <Link to={`/notebook/${nb.id}`} className="block">
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(nb.updatedAt)}
                    </p>
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
                      <DropdownMenuItem
                        onClick={() => handleDelete(nb.id, nb.title)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Library;
