import React from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import Logo from './Logo';
import { useStudentClass } from '../context/StudentClassContext';

const StudentWaiting = () => {
  const { session, deviceCode, syncing, syncNow, syncError, lastSyncAt } = useStudentClass();

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-4 text-center">
      <Logo size="lg" className="mb-6" />
      <Clock className="w-12 h-12 text-slate-400 mb-4" />
      <h2 className="text-lg font-semibold mb-2">Demande envoyée</h2>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        Bonjour {session?.displayName} — montre ce code à ton professeur pour qu&apos;il
        t&apos;inscrive sur JokkoNote.
      </p>
      <div className="rounded-xl border-2 border-dashed border-brand-300 dark:border-chrome-700 bg-brand-50 dark:bg-chrome-900/50 px-8 py-4 mb-6">
        <p className="text-xs text-slate-500 mb-1">Ton code appareil (8 caractères)</p>
        <p className="text-3xl font-bold tracking-widest text-brand-600">{deviceCode}</p>
        <p className="text-[11px] text-slate-400 mt-2">Valable uniquement sur cet appareil</p>
      </div>
      {syncError && (
        <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 mb-4 max-w-sm">
          Connexion au serveur impossible ({syncError}). Vérifie la 4G / le partage de connexion, puis
          réessaie.
        </p>
      )}
      {lastSyncAt && !syncError && (
        <p className="text-xs text-slate-400 mb-3">
          Dernière vérification :{' '}
          {new Date(lastSyncAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
      <Button variant="outline" onClick={syncNow} disabled={syncing} className="gap-2">
        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        Vérifier à nouveau
      </Button>
      <p className="text-xs text-slate-400 mt-6 max-w-xs">
        Le prof doit inscrire <strong>ce code exact</strong> depuis la tablette affichée ici — pas un
        autre appareil.
      </p>
    </div>
  );
};

export default StudentWaiting;
