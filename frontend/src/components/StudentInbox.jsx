import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  RefreshCw,
  BookPlus,
} from 'lucide-react';
import { Button } from './ui/button';
import { useStudentClass } from '../context/StudentClassContext';
import { COMM_TYPES } from '../lib/classSync';
import { canImportComm } from '../lib/commImport';
import CommImportDialog from './CommImportDialog';
import DeadlineBadge from './DeadlineBadge';
import { DEADLINE_STYLES, getDeadlineUrgency } from '../lib/deadline';

const TYPE_META = {
  [COMM_TYPES.MESSAGE]: { label: 'Message', icon: MessageSquare },
  [COMM_TYPES.PDF]: { label: 'PDF', icon: FileText },
  [COMM_TYPES.IMAGE]: { label: 'Image', icon: ImageIcon },
};

const StudentInbox = () => {
  const {
    session,
    communications,
    newCount,
    syncing,
    lastSyncAt,
    syncNow,
    markCommunicationSeen,
    isCommUnread,
    syncConfigured,
    syncError,
  } = useStudentClass();
  const [filter, setFilter] = useState('all');
  const [importComm, setImportComm] = useState(null);

  const filtered = communications.filter((c) => filter === 'all' || c.type === filter);

  const formatWhen = (ts) =>
    new Date(ts).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-600" />
            Réception
            {newCount > 0 && (
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                <span className="bg-red-600 text-white px-2 py-0.5 rounded-full font-bold mr-1">
                  {newCount}
                </span>
                message{newCount > 1 ? 's' : ''} non lu{newCount > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {session?.classIds?.length
              ? `${session.classIds.length} classe${session.classIds.length > 1 ? 's' : ''}`
              : 'Réception'}
            {lastSyncAt && ` · sync ${formatWhen(lastSyncAt)}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={syncNow}
          disabled={syncing || !syncConfigured}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <div className="flex gap-2 px-4 sm:px-6 py-3 overflow-x-auto thin-scroll">
        {['all', COMM_TYPES.MESSAGE, COMM_TYPES.PDF, COMM_TYPES.IMAGE].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            {f === 'all' ? 'Tout' : TYPE_META[f]?.label || f}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-3">
        {!syncConfigured && (
          <p className="text-sm text-slate-500 text-center py-8">
            Configurez le serveur de sync pour recevoir les envois du prof.
          </p>
        )}
        {syncConfigured && syncError && (
          <p className="text-sm text-amber-600 dark:text-amber-400 text-center py-4 px-4 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40">
            Connexion au serveur difficile — nouvel essai automatique… ({syncError})
          </p>
        )}
        {syncConfigured && filtered.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-12">
            Aucun envoi pour l&apos;instant.
          </p>
        )}
        {filtered.map((comm) => {
          const meta = TYPE_META[comm.type] || TYPE_META[COMM_TYPES.MESSAGE];
          const Icon = meta.icon;
          const unread = isCommUnread(comm.id);
          const importable = canImportComm(comm);
          const urgency = getDeadlineUrgency(comm.deadlineAt);
          const deadlineStyle = urgency ? DEADLINE_STYLES[urgency] : null;

          return (
            <div
              key={comm.id}
              className={`rounded-xl border bg-white dark:bg-slate-900 transition-colors ${
                unread
                  ? 'border-blue-400 dark:border-blue-600 shadow-sm shadow-blue-500/10'
                  : deadlineStyle
                    ? deadlineStyle.border
                    : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {unread && <div className="h-1 bg-red-600 rounded-t-xl" />}
              <div className="p-4">
                <Link
                  to={`/view/${comm.id}`}
                  onClick={() => markCommunicationSeen(comm)}
                  className="flex items-start gap-3"
                >
                  <div className="relative w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                    {unread && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white dark:border-slate-900" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{comm.title || meta.label}</p>
                      <DeadlineBadge deadlineAt={comm.deadlineAt} />
                    </div>
                    <p className="text-xs text-blue-600 font-medium">{comm.teacherName}</p>
                    {comm.body && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{comm.body}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">{formatWhen(comm.createdAt)}</p>
                  </div>
                </Link>
                {importable && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full gap-2 text-blue-700 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={() => setImportComm(comm)}
                  >
                    <BookPlus className="w-4 h-4" />
                    Importer dans un cahier
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CommImportDialog
        comm={importComm}
        open={Boolean(importComm)}
        onOpenChange={(open) => !open && setImportComm(null)}
      />
    </div>
  );
};

export default StudentInbox;
