import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import Logo from './Logo';
import { useStudentClass } from '../context/StudentClassContext';

const StudentWaiting = () => {
  const { session, deviceCode, syncing, syncNow } = useStudentClass();

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-4 text-center">
      <Logo size="lg" className="mb-6" />
      <Clock className="w-12 h-12 text-slate-400 mb-4" />
      <h2 className="text-lg font-semibold mb-2">En attente d&apos;inscription</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        Bonjour {session?.displayName} — demande à ton professeur de t&apos;inscrire avec ce code
        sur JokkoNote.
      </p>
      <div className="rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50 px-8 py-4 mb-6">
        <p className="text-xs text-slate-500 mb-1">Ton code appareil</p>
        <p className="text-3xl font-bold tracking-widest text-blue-600">{deviceCode}</p>
      </div>
      <Button variant="outline" onClick={syncNow} disabled={syncing} className="gap-2">
        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        Vérifier à nouveau
      </Button>
    </div>
  );
};

export default StudentWaiting;
