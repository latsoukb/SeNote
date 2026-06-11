import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { useStudentClass } from '../context/StudentClassContext';
import { useDeadlineItems } from '../hooks/useDeadlineItems';
import DeadlineDoneButton from './DeadlineDoneButton';
import {
  DEADLINE_STYLES,
  formatDeadline,
  formatDeadlineStatus,
} from '../lib/deadline';

const URGENCY_DOT = {
  red: 'bg-red-500',
  yellow: 'bg-amber-400',
  green: 'bg-emerald-500',
  done: 'bg-emerald-400/60',
};

const DeadlineSidebarSection = () => {
  const { markCommunicationSeen } = useStudentClass();
  const { items, pendingCount, enrolled } = useDeadlineItems();

  if (!enrolled || items.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
      <p className="text-xs uppercase tracking-wide font-medium text-slate-500 px-2 mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 min-w-0">
          <CalendarClock className="w-3.5 h-3.5 shrink-0" />
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
          <span className="text-[10px] font-bold bg-red-600 text-white min-w-[1.1rem] h-4 px-1 rounded-full flex items-center justify-center shrink-0">
            {pendingCount}
          </span>
        )}
      </p>
      <div className="space-y-1.5 max-h-[min(42vh,260px)] overflow-y-auto thin-scroll pr-0.5">
        {items.map(({ comm, urgency, done }) => {
          const style = DEADLINE_STYLES[urgency];
          return (
            <div
              key={comm.id}
              className={`relative rounded-lg border text-left transition-colors ${
                done
                  ? 'border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 opacity-80'
                  : `${style.border} ${style.bg}`
              }`}
            >
              <Link
                to={`/view/${comm.id}`}
                onClick={() => markCommunicationSeen(comm)}
                className="block px-2.5 py-2 pr-9 active:scale-[0.99]"
              >
                <div className="flex items-start gap-1.5 min-w-0">
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${URGENCY_DOT[urgency]}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate leading-tight">
                      {comm.title || 'Travail'}
                    </p>
                    <p className="text-[10px] opacity-80 truncate">{comm.teacherName}</p>
                    <p className="text-[10px] font-medium tabular-nums mt-0.5 leading-tight">
                      {formatDeadlineStatus(comm.deadlineAt, done)}
                    </p>
                    <p className="text-[9px] opacity-70 truncate">
                      {formatDeadline(comm.deadlineAt)}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="absolute top-1.5 right-1.5 z-10 scale-90 origin-top-right">
                <DeadlineDoneButton commId={comm.id} variant="block" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeadlineSidebarSection;
