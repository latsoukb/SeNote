import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from './ui/button';
import { useStudentClass } from '../context/StudentClassContext';
import { toast } from 'sonner';

/** Code appareil 8 car. — visible même une fois inscrit (autre prof). */
const StudentDeviceCode = ({ variant = 'bar', className = '' }) => {
  const { deviceCode } = useStudentClass();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(deviceCode);
      toast.success('Code copié', { description: deviceCode });
    } catch {
      toast.error('Copie impossible');
    }
  };

  if (variant === 'chip') {
    return (
      <button
        type="button"
        onClick={copy}
        className={`inline-flex items-center gap-1.5 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors ${className}`}
        title="Copier le code pour un autre professeur"
      >
        <span className="text-slate-500 font-normal">Code</span>
        <span className="font-bold tracking-wider">{deviceCode}</span>
        <Copy className="w-3 h-3 opacity-70" />
      </button>
    );
  }

  if (variant === 'settings') {
    return (
      <div className={`space-y-3 rounded-xl border-2 border-dashed border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950/40 p-4 ${className}`}>
        <div>
          <p className="text-sm font-medium">Mon code tablette</p>
          <p className="text-xs text-slate-500 mt-1">
            Donne ce code à un autre professeur pour rejoindre une autre classe sur le même
            appareil.
          </p>
        </div>
        <p className="text-3xl font-bold tracking-[0.2em] text-center text-brand-600 py-2">
          {deviceCode}
        </p>
        <Button type="button" variant="outline" onClick={copy} className="w-full gap-2">
          <Copy className="w-4 h-4" />
          Copier le code
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50/80 dark:bg-brand-950/40 px-3 py-2 ${className}`}>
      <div className="min-w-0 text-left">
        <p className="text-[11px] text-slate-500">Code tablette (autre prof)</p>
        <p className="text-lg font-bold tracking-widest text-brand-600">{deviceCode}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-1.5 shrink-0">
        <Copy className="w-3.5 h-3.5" />
        Copier
      </Button>
    </div>
  );
};

export default StudentDeviceCode;
