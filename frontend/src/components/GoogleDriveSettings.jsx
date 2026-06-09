import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { useSettings } from '../context/SettingsContext';
import { isNativeApp } from '../lib/platform';
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
  const { driveSyncing, syncNowToDrive, storageLabel } = useNotes();
  const { settings, updateSettings } = useSettings();
  const [status, setStatus] = useState({
    connected: false,
    email: null,
    lastSync: null,
    configured: false,
    available: false,
  });

  const refresh = async () => {
    setStatus(await getDriveStatus());
  };

  useEffect(() => {
    refresh();
  }, [driveSyncing]);

  const handleConnect = async () => {
    if (!isDriveConfigured()) {
      toast.error(
        isNativeApp()
          ? 'Configurez REACT_APP_GOOGLE_CLIENT_ID (voir ANDROID.md)'
          : 'Configurez REACT_APP_GOOGLE_WEB_CLIENT_ID (voir GOOGLE_DRIVE.md)'
      );
      return;
    }
    try {
      await signInGoogleDrive();
      await refresh();
      await syncNowToDrive();
      toast.success('Connecté à Google Drive');
    } catch (e) {
      toast.error(e.message || 'Connexion impossible');
    }
  };

  const handleDisconnect = async () => {
    await signOutGoogleDrive();
    await refresh();
    toast('Déconnecté de Google Drive');
  };

  const handleSync = async () => {
    const ok = await syncNowToDrive();
    if (ok) {
      await refresh();
      toast.success('Synchronisé avec Google Drive');
    } else {
      toast.error('Échec de la synchronisation');
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
      <Label className="flex items-center gap-2">
        <Cloud className="w-4 h-4" />
        Google Drive
      </Label>
      <p className="text-xs text-slate-500">
        Stockage local : <strong>{storageLabel}</strong> (toujours actif). Drive = copie cloud
        gratuite (15 Go par compte Google).
        {!isNativeApp() && ' Testable sur Mac via un client OAuth Web.'}
      </p>

      {!isDriveConfigured() && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Client Google non configuré — voir{' '}
          {isNativeApp() ? 'ANDROID.md' : 'GOOGLE_DRIVE.md'} (section Google Cloud).
        </p>
      )}

      {status.connected ? (
        <div className="space-y-2">
          <p className="text-sm text-green-600 dark:text-green-400">
            Connecté : {status.email}
          </p>
          <p className="text-xs text-slate-500">
            Dernière sync : {formatSyncTime(status.lastSync)}
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
              Sync maintenant
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
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
          onClick={handleConnect}
          disabled={!isDriveConfigured()}
        >
          <Cloud className="w-4 h-4" />
          Connecter Google Drive
        </Button>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="drive-auto">Sync automatique</Label>
          <p className="text-xs text-slate-500">Toutes les 60 s quand l&apos;app est ouverte</p>
        </div>
        <Switch
          id="drive-auto"
          checked={settings.googleDriveAutoSync !== false}
          onCheckedChange={(v) => updateSettings({ googleDriveAutoSync: v })}
        />
      </div>
    </div>
  );
};

export default GoogleDriveSettings;
