import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useSettings } from '../context/SettingsContext';
import { isNativeApp } from '../lib/platform';
import { ensureAppConfig } from '../lib/appConfig';
import {
  getDriveStatus,
  signInGoogleDrive,
  signOutGoogleDrive,
  isDriveConfigured,
} from '../lib/googleDriveSync';
import { toast } from 'sonner';

const formatSyncTime = (ts) => {
  if (!ts) return 'Jamais';
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const GoogleDriveSettings = () => {
  const { driveSyncing, syncNowToDrive } = useNotes();
  const { settings, updateSettings } = useSettings();
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [status, setStatus] = useState({
    connected: false,
    email: null,
    lastSync: null,
  });

  const refresh = async () => {
    setStatus(await getDriveStatus());
  };

  useEffect(() => {
    (async () => {
      await ensureAppConfig();
      setConfigured(isDriveConfigured());
      setReady(true);
      await refresh();
    })();
  }, [driveSyncing]);

  const handleConnect = async () => {
    if (!configured) {
      toast.error('La sauvegarde cloud n\'est pas encore activée sur cette installation.');
      return;
    }
    try {
      toast.message('Redirection vers Google…');
      await signInGoogleDrive();
    } catch (e) {
      console.warn('Google Drive connect', e);
      toast.error(e.message || 'Connexion impossible');
    }
  };

  const handleDisconnect = async () => {
    await signOutGoogleDrive();
    await refresh();
    toast('Compte Google Drive déconnecté');
  };

  const handleSync = async () => {
    const ok = await syncNowToDrive();
    if (ok) {
      await refresh();
      toast.success('Cahiers synchronisés');
    } else {
      toast.error('Synchronisation impossible');
    }
  };

  const storageHint = isNativeApp()
    ? 'Vos cahiers sont enregistrés sur la tablette. Google Drive conserve une copie de secours dans le cloud (15 Go gratuits par compte).'
    : 'Vos cahiers sont enregistrés sur cet appareil. Google Drive conserve une copie de secours dans le cloud (15 Go gratuits par compte).';

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-chrome-800">
      <Label className="flex items-center gap-2">
        <Cloud className="w-4 h-4" />
        Sauvegarde cloud
      </Label>
      <p className="text-xs text-slate-500 leading-relaxed">{storageHint}</p>

      {!ready ? (
        <p className="text-xs text-slate-500">Chargement…</p>
      ) : !configured ? (
        <p className="text-xs text-slate-500 leading-relaxed">
          La connexion Google Drive n&apos;est pas encore disponible sur cette installation.
          Contactez l&apos;administrateur de votre établissement.
        </p>
      ) : status.connected ? (
        <div className="space-y-2">
          <p className="text-sm text-green-600 dark:text-green-400">
            Compte connecté : {status.email}
          </p>
          <p className="text-xs text-slate-500">
            Dernière synchronisation : {formatSyncTime(status.lastSync)}
            {driveSyncing && ' · en cours…'}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={handleSync}
              disabled={driveSyncing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${driveSyncing ? 'animate-spin' : ''}`} />
              Synchroniser
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleDisconnect}>
              <CloudOff className="w-3.5 h-3.5 mr-1" />
              Déconnecter
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          className="w-full gap-2 bg-brand-600 hover:bg-brand-700"
          onClick={handleConnect}
        >
          <Cloud className="w-4 h-4" />
          Connecter Google Drive
        </Button>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="drive-auto">Synchronisation automatique</Label>
          <p className="text-xs text-slate-500 leading-relaxed">
            Met à jour la copie cloud après chaque modification, puis toutes les 5 minutes.
          </p>
        </div>
        <Switch
          id="drive-auto"
          checked={settings.googleDriveAutoSync !== false}
          onCheckedChange={(v) => updateSettings({ googleDriveAutoSync: v })}
          disabled={!configured}
        />
      </div>
    </div>
  );
};

export default GoogleDriveSettings;
