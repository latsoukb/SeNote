import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, ChevronRight } from 'lucide-react';
import { useStudentClass } from '../context/StudentClassContext';
import DeadlineDoneButton from './DeadlineDoneButton';
import {
  DEADLINE_STYLES,
  formatDeadline,
  formatDeadlineStatus,
  getDeadlineDisplayUrgency,
} from '../lib/deadline';

const URGENCY_ORDER = { red: 0, yellow: 1, green: 2, done: 3 };

const BLOCK_STYLES = {
  red: 'bg-red-600 border-red-700 text-white shadow-red-900/20',
  yellow: 'bg-amber-500 border-amber-600 text-white shadow-amber-900/20',
  green: 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-900/20',
  done: 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-900/20 opacity-90',
};

const DeadlineHomeBlocks = () => {
  const { communications, enrolled, markCommunicationSeen, isCommunicationDone } =
    useStudentClass();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const items = useMemo(() => {
    void tick;
    return (communications || [])
      .filter((c) => c.deadlineAt)
      .map((c) => {
        const done = isCommunicationDone(c.id);
        return {
          comm: c,
          done,
          urgency: getDeadlineDisplayUrgency(c.deadlineAt, done),
        };
      })
      .filter((x) => x.urgency)
      .sort((a, b) => {
        const oa = URGENCY_ORDER[a.urgency] ?? 9;
        const ob = URGENCY_ORDER[b.urgency] ?? 9;
        if (oa !== ob) return oa - ob;
        return Number(a.comm.deadlineAt) - Number(b.comm.deadlineAt);
      });
  }, [communications, tick, isCommunicationDone]);

  if (!enrolled || items.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-2">
        <CalendarClock className="w-4 h-4" />
        Échéances
      </h2>
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
    </section>
  );
};

export default DeadlineHomeBlocks;
