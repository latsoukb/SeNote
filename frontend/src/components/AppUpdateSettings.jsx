import React, { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Download, RefreshCw, Smartphone } from 'lucide-react';
import { isNativeApp } from '../lib/platform';
import {
  checkForAppUpdate,
  downloadAndInstallUpdate,
  getBuildInfo,
  getInstalledAppInfo,
  SIGNATURE_CONFLICT_HELP,
} from '../lib/appUpdate';
import { toast } from 'sonner';

const AppUpdateSettings = () => {
  const [installed, setInstalled] = useState(null);
  const [remote, setRemote] = useState(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState(null);
  const [installHelp, setInstallHelp] = useState('');
  const [debugBuild, setDebugBuild] = useState(false);

  const refreshInstalled = useCallback(async () => {
    try {
      setInstalled(await getInstalledAppInfo());
      const build = await getBuildInfo();
      setDebugBuild(Boolean(build.debug));
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

  const handleInstall = async () => {
    if (!remote?.downloadUrl) return;
    setInstallHelp('');
    setInstalling(true);
    setDownloadPercent(0);
    try {
      toast.message('Téléchargement de la mise à jour…');
      await downloadAndInstallUpdate(
        remote.downloadUrl,
        (phase, percent) => {
          if (phase === 'download' && typeof percent === 'number') {
            setDownloadPercent(percent);
          }
          if (phase === 'install') {
            setDownloadPercent(100);
            toast.message('Confirmez l’installation dans la fenêtre Android.', {
              duration: 8000,
            });
            setInstallHelp(
              'Si Android affiche « conflit de package » ou « not installed », voir la notice ci-dessous.'
            );
          }
        },
        remote.versionName
      );
    } catch (e) {
      console.warn('App update install', e);
      toast.error(e.message || 'Mise à jour impossible');
    } finally {
      setInstalling(false);
      setDownloadPercent(null);
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
        Télécharge et installe la mise à jour officielle (Wi‑Fi requis). Android affichera une
        confirmation.
      </p>
      {(installHelp || debugBuild) && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-2">
          {debugBuild && (
            <p>
              Version de test détectée. Si la mise à jour échoue, réinstallez l&apos;APK officiel
              depuis GitHub.
            </p>
          )}
          <p>{installHelp || SIGNATURE_CONFLICT_HELP}</p>
        </div>
      )}
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
          {installing && downloadPercent !== null && (
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-brand-200 dark:bg-brand-900 overflow-hidden">
                <div
                  className="h-full bg-brand-600 transition-all duration-300"
                  style={{ width: `${downloadPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                Téléchargement {downloadPercent}%
              </p>
            </div>
          )}
          <Button
            type="button"
            className="w-full gap-2 bg-brand-600 hover:bg-brand-700"
            onClick={handleInstall}
            disabled={installing}
          >
            <Download className={`w-4 h-4 ${installing ? 'animate-pulse' : ''}`} />
            {installing ? 'Mise à jour en cours…' : 'Mettre à jour'}
          </Button>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={handleCheck}
        disabled={checking || installing}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
        Vérifier les mises à jour
      </Button>
    </div>
  );
};

export default AppUpdateSettings;
