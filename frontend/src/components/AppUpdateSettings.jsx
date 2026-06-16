import React, { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Download, ExternalLink, RefreshCw, Smartphone } from 'lucide-react';
import { isNativeApp } from '../lib/platform';
import {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  getInstalledAppInfo,
  openApkInSystemBrowser,
  GITHUB_LATEST_APK_URL,
} from '../lib/appUpdate';
import { toast } from 'sonner';

const AppUpdateSettings = () => {
  const [installed, setInstalled] = useState(null);
  const [remote, setRemote] = useState(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);

  const refreshInstalled = useCallback(async () => {
    try {
      setInstalled(await getInstalledAppInfo());
    } catch {
      setInstalled(null);
    }
  }, []);

  useEffect(() => {
    if (isNativeApp()) refreshInstalled();
  }, [refreshInstalled]);

  if (!isNativeApp()) return null;

  const handleCheck = async () => {
    setChecking(true);
    try {
      const result = await checkForAppUpdate();
      setInstalled(result.installed);
      setRemote(result.remote);
      if (result.available) {
        toast.message(`Version ${result.remote.versionName} disponible`);
      } else {
        toast.success('SeNote est à jour');
      }
    } catch (e) {
      console.warn('App update check', e);
      toast.error(e.message || 'Vérification impossible');
    } finally {
      setChecking(false);
    }
  };

  const handleInstall = async (url) => {
    setInstalling(true);
    try {
      toast.message('Ouverture du navigateur…');
      await downloadAndInstallUpdate(url, (phase) => {
        if (phase === 'install') {
          toast.message(
            'Touchez le fichier téléchargé dans Chrome, puis Installez.',
            { duration: 8000 }
          );
        }
      });
    } catch (e) {
      console.warn('App update install', e);
      toast.error(e.message || 'Installation impossible');
    } finally {
      setInstalling(false);
    }
  };

  const handleOpenGithub = async () => {
    setInstalling(true);
    try {
      toast.message('Ouverture de GitHub…');
      await openApkInSystemBrowser(GITHUB_LATEST_APK_URL);
      toast.message('Touchez SeNote-tablet.apk puis Installez.', { duration: 8000 });
    } catch (e) {
      toast.error(e.message || 'Impossible d’ouvrir le navigateur');
    } finally {
      setInstalling(false);
    }
  };

  const updateAvailable =
    remote && installed && remote.versionCode > installed.versionCode;

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-chrome-800">
      <Label className="flex items-center gap-2">
        <Smartphone className="w-4 h-4" />
        Mise à jour SeNote
      </Label>
      <p className="text-xs text-slate-500 leading-relaxed">
        Vérifiez les mises à jour (Wi‑Fi requis). L&apos;installation ouvre Chrome — touchez
        le fichier APK téléchargé puis Installez.
      </p>
      {installed && (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Version installée : <span className="font-medium">{installed.version}</span>
          {remote && !updateAvailable && (
            <span className="text-slate-500"> · dernière version publiée</span>
          )}
        </p>
      )}
      {updateAvailable && (
        <div className="rounded-lg border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950/30 p-3 space-y-2">
          <p className="text-sm font-medium text-brand-800 dark:text-brand-200">
            Version {remote.versionName} disponible
          </p>
          {remote.releaseNotes && (
            <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {remote.releaseNotes}
            </p>
          )}
          <Button
            type="button"
            className="w-full gap-2 bg-brand-600 hover:bg-brand-700"
            onClick={() => handleInstall(remote.downloadUrl)}
            disabled={installing}
          >
            <Download className={`w-4 h-4 ${installing ? 'animate-pulse' : ''}`} />
            {installing ? 'Ouverture…' : 'Télécharger et installer'}
          </Button>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 flex-1"
          onClick={handleCheck}
          disabled={checking || installing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          Vérifier les mises à jour
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 flex-1"
          onClick={handleOpenGithub}
          disabled={checking || installing}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Installer depuis GitHub
        </Button>
      </div>
    </div>
  );
};

export default AppUpdateSettings;
