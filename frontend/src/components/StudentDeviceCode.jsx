import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from './ui/button';
import { useStudentClass } from '../context/StudentClassContext';
import { toast } from 'sonner';

/** Code appareil 8 car. — visible même une fois inscrit (autre prof). */
const StudentDeviceCode = ({ variant = 'bar' }) => {
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
        className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        title="Copier le code pour un autre professeur"
      >
        <span className="text-slate-500 font-normal">Code</span>
        <span className="font-bold tracking-wider">{deviceCode}</span>
        <Copy className="w-3 h-3 opacity-70" />
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40 px-3 py-2">
      <div className="min-w-0 text-left">
        <p className="text-[11px] text-slate-500">Code tablette (autre prof)</p>
        <p className="text-lg font-bold tracking-widest text-blue-600">{deviceCode}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={copy} className="gap-1.5 shrink-0">
        <Copy className="w-3.5 h-3.5" />
        Copier
      </Button>
    </div>
  );
};

export default StudentDeviceCode;
