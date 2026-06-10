import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, BookPlus, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useStudentClass } from '../context/StudentClassContext';
import { COMM_TYPES, fetchCommunicationDetail } from '../lib/classSync';
import { canImportComm } from '../lib/commImport';
import CommImportDialog from '../components/CommImportDialog';
import Logo from '../components/Logo';

const CommViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCommunicationById, upsertCommunication, markCommunicationSeen } = useStudentClass();
  const summary = getCommunicationById(id);
  const [comm, setComm] = useState(summary || null);
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (!summary) {
      setComm(null);
      return;
    }
    const needsDetail =
      summary.attachment?.hasData && !summary.attachment?.dataUrl;
    if (!needsDetail) {
      setComm(summary);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCommunicationDetail(summary.classId, summary.id)
      .then((full) => {
        if (cancelled) return;
        upsertCommunication(full);
        setComm(full);
      })
      .catch(() => {
        if (!cancelled) setComm(summary);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [summary, upsertCommunication]);

  useEffect(() => {
    if (comm) markCommunicationSeen(comm);
  }, [comm, markCommunicationSeen]);

  if (!summary && !comm) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-slate-500">Contenu introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          Retour
        </Button>
      </div>
    );
  }

  const view = comm || summary;

  const download = () => {
    if (!view.attachment?.dataUrl) return;
    const a = document.createElement('a');
    a.href = view.attachment.dataUrl;
    a.download = view.attachment.fileName || 'fichier';
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
          <p className="font-medium truncate">{view.title}</p>
          <p className="text-xs text-slate-500">{view.teacherName}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {canImportComm(view) && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={loading || !view.attachment?.dataUrl}
            >
              <BookPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
          )}
          {view.attachment?.dataUrl && (
            <Button variant="outline" size="sm" onClick={download} className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger</span>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-3xl mx-auto w-full">
        {loading && (
          <div className="flex items-center gap-2 text-slate-500 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement du contenu…
          </div>
        )}
        {view.body && (
          <p className="text-base leading-relaxed whitespace-pre-wrap mb-6">{view.body}</p>
        )}
        {view.type === COMM_TYPES.IMAGE && view.attachment?.dataUrl && (
          <img
            src={view.attachment.dataUrl}
            alt={view.title}
            className="max-w-full rounded-lg shadow-md border border-slate-200 dark:border-slate-800"
          />
        )}
        {view.type === COMM_TYPES.PDF && view.attachment?.dataUrl && (
          <iframe
            title={view.title}
            src={view.attachment.dataUrl}
            className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
          />
        )}
        {view.type === COMM_TYPES.MESSAGE && !view.body && (
          <p className="text-slate-500 italic">Message sans texte.</p>
        )}
      </main>

      <CommImportDialog comm={view} open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};

export default CommViewer;
