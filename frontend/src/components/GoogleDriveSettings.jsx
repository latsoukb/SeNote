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

const GoogleDriveSettings = ({ onBeforeConnect }) => {
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
      onBeforeConnect?.();
      await new Promise((r) => setTimeout(r, 350));
      await signInGoogleDrive();
      await refresh();
      await syncNowToDrive();
      toast.success('Connecté à Google Drive');
    } catch (e) {
      console.warn('Google Drive connect', e);
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
    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-chrome-800">
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
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          Client Google non configuré sur cette version du site. Sur GitHub Pages, ajoutez le secret{' '}
          <code className="text-[10px]">REACT_APP_GOOGLE_WEB_CLIENT_ID</code> dans les paramètres du
          dépôt, et l&apos;origine <code className="text-[10px]">https://latsoukb.github.io</code> dans
          Google Cloud. Voir {isNativeApp() ? 'ANDROID.md' : 'GOOGLE_DRIVE.md'}.
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
          className="w-full gap-2 bg-brand-600 hover:bg-brand-700"
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
          <p className="text-xs text-slate-500">
            Met à jour le fichier Drive ~2,5 s après chaque modification de cahier.
          </p>
          <p className="text-xs text-slate-500">Sauvegarde de secours toutes les 5 min</p>
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
