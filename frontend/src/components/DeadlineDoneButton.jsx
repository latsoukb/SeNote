import React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { useStudentClass } from '../context/StudentClassContext';

const DeadlineDoneButton = ({ commId, variant = 'block' }) => {
  const { isCommunicationDone, toggleCommunicationDone } = useStudentClass();
  const done = isCommunicationDone(commId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCommunicationDone(commId);
  };

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
          done
            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900'
            : 'bg-slate-100 dark:bg-chrome-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-chrome-700'
        }`}
      >
        {done ? (
          <>
            <RotateCcw className="w-3.5 h-3.5" />
            À refaire
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5" />
            Marquer fait
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-colors ${
        done
          ? 'bg-white/25 hover:bg-white/35 text-white'
          : 'bg-black/20 hover:bg-black/30 text-white'
      }`}
      title={done ? 'Marquer comme à refaire' : 'Marquer comme terminé'}
    >
      {done ? (
        <>
          <RotateCcw className="w-3 h-3" />
          À refaire
        </>
      ) : (
        <>
          <Check className="w-3 h-3" />
          Fait
        </>
      )}
    </button>
  );
};

export default DeadlineDoneButton;
