import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, BookPlus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useStudentClass } from '../context/StudentClassContext';
import { COMM_TYPES } from '../lib/classSync';
import { canImportComm } from '../lib/commImport';
import CommImportDialog from '../components/CommImportDialog';
import Logo from '../components/Logo';

const CommViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCommunicationById, markCommunicationSeen } = useStudentClass();
  const comm = getCommunicationById(id);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (comm) markCommunicationSeen(comm);
  }, [comm, markCommunicationSeen]);

  if (!comm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-slate-500">Contenu introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Retour
        </Button>
      </div>
    );
  }

  const download = () => {
    if (!comm.attachment?.dataUrl) return;
    const a = document.createElement('a');
    a.href = comm.attachment.dataUrl;
    a.download = comm.attachment.fileName || 'fichier';
    a.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/?view=reception')} aria-label="Retour">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Logo size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{comm.title}</p>
          <p className="text-xs text-slate-500">{comm.teacherName}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {canImportComm(comm) && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <BookPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
          )}
          {comm.attachment?.dataUrl && (
            <Button variant="outline" size="sm" onClick={download} className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger</span>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-3xl mx-auto w-full">
        {comm.body && (
          <p className="text-base leading-relaxed whitespace-pre-wrap mb-6">{comm.body}</p>
        )}
        {comm.type === COMM_TYPES.IMAGE && comm.attachment?.dataUrl && (
          <img
            src={comm.attachment.dataUrl}
            alt={comm.title}
            className="max-w-full rounded-lg shadow-md border border-slate-200 dark:border-slate-800"
          />
        )}
        {comm.type === COMM_TYPES.PDF && comm.attachment?.dataUrl && (
          <iframe
            title={comm.title}
            src={comm.attachment.dataUrl}
            className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
          />
        )}
        {comm.type === COMM_TYPES.MESSAGE && !comm.body && (
          <p className="text-slate-500 italic">Message sans texte.</p>
        )}
      </main>

      <CommImportDialog comm={comm} open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};

export default CommViewer;
