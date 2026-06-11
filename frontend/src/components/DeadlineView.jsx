import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ChevronRight } from 'lucide-react';
import { useStudentClass } from '../context/StudentClassContext';
import { useDeadlineItems } from '../hooks/useDeadlineItems';
import DeadlineDoneButton from './DeadlineDoneButton';
import {
  DEADLINE_STYLES,
  formatDeadline,
  formatDeadlineStatus,
} from '../lib/deadline';

const BLOCK_STYLES = {
  red: 'bg-red-600 border-red-700 text-white shadow-red-900/20',
  yellow: 'bg-amber-500 border-amber-600 text-white shadow-amber-900/20',
  green: 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-900/20',
  done: 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-900/20 opacity-90',
};

export const DeadlineSidebarLink = ({ mainView, setMainView, onNavigate }) => {
  const { items, pendingCount, enrolled } = useDeadlineItems();

  if (!enrolled || items.length === 0) return null;

  return (
    <button
      type="button"
      onClick={() => {
        setMainView('deadlines');
        onNavigate?.();
      }}
      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors justify-between ${
        mainView === 'deadlines'
          ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-medium'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
      <span className="flex items-center gap-2 min-w-0">
        <CalendarClock className="w-4 h-4 shrink-0" />
        <span className="truncate">Échéances</span>
        {pendingCount > 0 && (
          <span
            className="w-2 h-2 rounded-full bg-red-500 shrink-0"
            title={`${pendingCount} travail${pendingCount > 1 ? 'x' : ''} en cours`}
            aria-hidden
          />
        )}
      </span>
      {pendingCount > 0 && (
        <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold shrink-0">
          {pendingCount}
        </span>
      )}
    </button>
  );
};

const DeadlineView = () => {
  const { markCommunicationSeen } = useStudentClass();
  const { items, pendingCount } = useDeadlineItems();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CalendarClock className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="font-medium text-lg">Aucune échéance</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Les travaux avec date limite apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <CalendarClock className="w-8 h-8 text-brand-600" />
          Échéances
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {pendingCount > 0
            ? `${pendingCount} travail${pendingCount > 1 ? 'x' : ''} en cours sur ${items.length}`
            : `${items.length} travail${items.length > 1 ? 'x' : ''} — tout est terminé`}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(({ comm, urgency, done }) => {
          const style = DEADLINE_STYLES[urgency];
          const block = BLOCK_STYLES[urgency];
          return (
            <div
              key={comm.id}
              className={`relative rounded-xl border-2 shadow-md transition-transform hover:scale-[1.02] ${block}`}
            >
              <Link
                to={`/view/${comm.id}`}
                onClick={() => markCommunicationSeen(comm)}
                className="block px-4 py-3 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2 pr-16">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                      {style.label}
                    </p>
                    <p className="font-semibold truncate mt-0.5">{comm.title || 'Travail'}</p>
                    <p className="text-xs opacity-90 truncate">{comm.teacherName}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0 opacity-80 mt-1" />
                </div>
                <div className="mt-3 pt-2 border-t border-white/25">
                  <p className="text-lg font-bold tabular-nums leading-tight">
                    {formatDeadlineStatus(comm.deadlineAt, done)}
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Pour le {formatDeadline(comm.deadlineAt)}
                  </p>
                </div>
              </Link>
              <div className="absolute top-3 right-3 z-10">
                <DeadlineDoneButton commId={comm.id} variant="block" />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default DeadlineView;
