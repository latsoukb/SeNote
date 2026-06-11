import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookPlus, FolderInput, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useNotes } from '../context/NotesContext';
import { getNotebookSections } from '../lib/notebookSections';
import { fetchCommunicationDetail } from '../lib/classSync';
import { getCommBackgrounds } from '../lib/commImport';
import { commNeedsDetailFetch } from '../lib/commAttachments';
import { toast } from 'sonner';

const CommImportDialog = ({ comm, open, onOpenChange }) => {
  const navigate = useNavigate();
  const { notebooks, importPdfNotebook, appendPdfPagesToNotebook } = useNotes();
  const [mode, setMode] = useState('new');
  const [notebookId, setNotebookId] = useState('');
  const [loading, setLoading] = useState(false);

  const runImport = async () => {
    if (!comm) return;
    setLoading(true);
    const toastId = toast.loading('Import en cours…');
    try {
      let source = comm;
      if (commNeedsDetailFetch(source)) {
        source = await fetchCommunicationDetail(source.classId, source.id);
      }
      const backgrounds = await getCommBackgrounds(source);
      if (!backgrounds?.length) {
        throw new Error('Document non importable');
      }
      const title = comm.title || 'Document';

      if (mode === 'new') {
        const nb = importPdfNotebook(title, backgrounds, 'cover-paper');
        toast.success('Cahier créé', { id: toastId, description: title });
        onOpenChange(false);
        navigate(`/notebook/${nb.id}`);
      } else {
        if (!notebookId) throw new Error('Choisissez un cahier');
        const nb = notebooks.find((n) => n.id === notebookId);
        const sectionId = getNotebookSections(nb)[0]?.id;
        if (!sectionId) throw new Error('Cahier invalide');
        appendPdfPagesToNotebook(notebookId, sectionId, backgrounds);
        toast.success('Pages ajoutées', {
          id: toastId,
          description: `${backgrounds.length} page${backgrounds.length > 1 ? 's' : ''}`,
        });
        onOpenChange(false);
        navigate(`/notebook/${notebookId}`);
      }
    } catch (err) {
      toast.error(err.message || 'Import impossible', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (!comm) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importer dans un cahier</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 truncate">{comm.title}</p>

        <div className="grid grid-cols-2 gap-2 py-2">
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              mode === 'new'
                ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                : 'border-slate-200 dark:border-brand-700'
            }`}
          >
            <BookPlus className="w-6 h-6" />
            <span className="text-sm font-medium">Nouveau cahier</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('append')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              mode === 'append'
                ? 'border-brand-600 bg-brand-50 dark:bg-brand-950'
                : 'border-slate-200 dark:border-brand-700'
            }`}
          >
            <FolderInput className="w-6 h-6" />
            <span className="text-sm font-medium">Cahier existant</span>
          </button>
        </div>

        {mode === 'append' && (
          <div className="space-y-2">
            <Label>Cahier</Label>
            {notebooks.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun cahier — créez-en un nouveau.</p>
            ) : (
              <Select value={notebookId} onValueChange={setNotebookId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un cahier" />
                </SelectTrigger>
                <SelectContent>
                  {notebooks.map((nb) => (
                    <SelectItem key={nb.id} value={nb.id}>
                      {nb.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={runImport}
            disabled={loading || (mode === 'append' && (!notebookId || notebooks.length === 0))}
            className="bg-brand-600 hover:bg-brand-700 gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Importer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommImportDialog;
