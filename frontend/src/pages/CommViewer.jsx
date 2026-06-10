import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, BookPlus, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useStudentClass } from '../context/StudentClassContext';
import { COMM_TYPES, fetchCommunicationDetail } from '../lib/classSync';
import { canImportComm } from '../lib/commImport';
import { commNeedsDetailFetch, getCommAttachments } from '../lib/commAttachments';
import CommImportDialog from '../components/CommImportDialog';
import Logo from '../components/Logo';
import DeadlineBadge from '../components/DeadlineBadge';
import DeadlineDoneButton from '../components/DeadlineDoneButton';

const isPdfAttachment = (att) =>
  att.type === COMM_TYPES.PDF || att.mimeType === 'application/pdf';

const isImageAttachment = (att) =>
  att.type === COMM_TYPES.IMAGE || att.mimeType?.startsWith('image/');

const CommViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getCommunicationById,
    upsertCommunication,
    markCommunicationSeen,
    isCommunicationDone,
  } = useStudentClass();
  const summary = getCommunicationById(id);
  const [comm, setComm] = useState(summary || null);
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (!summary) {
      setComm(null);
      return;
    }
    if (!commNeedsDetailFetch(summary)) {
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
  const attachments = getCommAttachments(view);
  const downloadable = attachments.filter((a) => a.dataUrl);
  const needsDetail = commNeedsDetailFetch(view);

  const downloadFile = (att) => {
    if (!att.dataUrl) return;
    const a = document.createElement('a');
    a.href = att.dataUrl;
    a.download = att.fileName || 'fichier';
    a.click();
  };

  const downloadAll = () => downloadable.forEach(downloadFile);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/?view=reception')} aria-label="Retour">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Logo size="sm" />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{view.title}</p>
          <p className="text-xs text-slate-500">
            {view.teacherName}
            {attachments.length > 1 && ` · ${attachments.length} fichiers`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {canImportComm(view) && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setImportOpen(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              disabled={loading || needsDetail}
            >
              <BookPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Importer</span>
            </Button>
          )}
          {downloadable.length === 1 && (
            <Button variant="outline" size="sm" onClick={() => downloadFile(downloadable[0])} className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Télécharger</span>
            </Button>
          )}
          {downloadable.length > 1 && (
            <Button variant="outline" size="sm" onClick={downloadAll} className="gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tout télécharger</span>
            </Button>
          )}
        </div>
      </header>

      {view.deadlineAt && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <DeadlineBadge
            deadlineAt={view.deadlineAt}
            done={isCommunicationDone(view.id)}
            variant="banner"
          />
          <div className="px-4 pb-2 sm:pb-0 sm:pr-4 shrink-0">
            <DeadlineDoneButton commId={view.id} variant="inline" />
          </div>
        </div>
      )}

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

        {attachments.length > 1 && (
          <ul className="mb-6 flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <li key={`${att.fileName}-${idx}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 max-w-full"
                  disabled={!att.dataUrl}
                  onClick={() => downloadFile(att)}
                >
                  {isPdfAttachment(att) ? (
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">{att.fileName || `Fichier ${idx + 1}`}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}

        {attachments.map((att, idx) => {
          if (!att.dataUrl) return null;
          if (isImageAttachment(att)) {
            return (
              <figure key={`${att.fileName}-${idx}`} className="mb-6">
                {attachments.length > 1 && (
                  <figcaption className="text-sm text-slate-500 mb-2">{att.fileName}</figcaption>
                )}
                <img
                  src={att.dataUrl}
                  alt={att.fileName || view.title}
                  className="max-w-full rounded-lg shadow-md border border-slate-200 dark:border-slate-800"
                />
              </figure>
            );
          }
          if (isPdfAttachment(att)) {
            return (
              <figure key={`${att.fileName}-${idx}`} className="mb-6">
                {attachments.length > 1 && (
                  <figcaption className="text-sm text-slate-500 mb-2">{att.fileName}</figcaption>
                )}
                <iframe
                  title={att.fileName || view.title}
                  src={att.dataUrl}
                  className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
                />
              </figure>
            );
          }
          return null;
        })}

        {view.type === COMM_TYPES.MESSAGE && !view.body && attachments.length === 0 && (
          <p className="text-slate-500 italic">Message sans texte.</p>
        )}
      </main>

      <CommImportDialog comm={view} open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};

export default CommViewer;
