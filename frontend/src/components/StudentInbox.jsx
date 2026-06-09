import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, FileText, Image as ImageIcon, MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useStudentClass } from '../context/StudentClassContext';
import { COMM_TYPES } from '../lib/classSync';

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
    syncConfigured,
  } = useStudentClass();
  const [filter, setFilter] = useState('all');

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
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Classe {session?.classId}
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
            {f === 'all' && newCount > 0 && (
              <span className="ml-1 bg-white/20 px-1 rounded">{newCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-3">
        {!syncConfigured && (
          <p className="text-sm text-slate-500 text-center py-8">
            Configurez le serveur de sync pour recevoir les envois du prof.
          </p>
        )}
        {syncConfigured && filtered.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-12">
            Aucun envoi pour l&apos;instant. Votre professeur enverra messages, PDF et images depuis
            JokkoNote.
          </p>
        )}
        {filtered.map((comm) => {
          const meta = TYPE_META[comm.type] || TYPE_META[COMM_TYPES.MESSAGE];
          const Icon = meta.icon;
          return (
            <Link
              key={comm.id}
              to={`/view/${comm.id}`}
              onClick={() => markCommunicationSeen(comm.id)}
              className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{comm.title || meta.label}</p>
                  <p className="text-xs text-blue-600 font-medium">{comm.teacherName}</p>
                  {comm.body && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{comm.body}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">{formatWhen(comm.createdAt)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default StudentInbox;
