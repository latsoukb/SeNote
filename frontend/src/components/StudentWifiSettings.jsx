import React, { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Wifi, RefreshCw, Lock, WifiOff, Signal } from 'lucide-react';
import { toast } from 'sonner';
import { isNativeApp } from '../lib/platform';
import { getKioskStatus } from '../lib/kioskLock';
import { WifiConnect } from '../plugins/wifiConnect';

const signalLabel = (level) => {
  if (level >= -55) return 'Excellent';
  if (level >= -67) return 'Bon';
  if (level >= -75) return 'Moyen';
  return 'Faible';
};

const StudentWifiSettings = ({ panelMode = false, autoScanKey = 0 }) => {
  const [deviceOwner, setDeviceOwner] = useState(false);
  const [status, setStatus] = useState({ wifiEnabled: false, connected: false, ssid: '' });
  const [networks, setNetworks] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [password, setPassword] = useState('');

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await WifiConnect.getStatus());
    } catch {
      setStatus({ wifiEnabled: false, connected: false, ssid: '' });
    }
  }, []);

  const handleScan = useCallback(async () => {
    setScanning(true);
    try {
      await refreshStatus();
      const result = await WifiConnect.scan();
      setNetworks(result.networks || []);
      if (!result.networks?.length) {
        toast.message('Aucun réseau trouvé. Réessayez ou rapprochez-vous du routeur.');
      }
    } catch (e) {
      const msg = e?.message || String(e);
      if (msg.includes('WIFI_DISABLED')) {
        toast.message('Activez le Wi‑Fi, puis recherchez à nouveau.');
      } else if (/permission|autorisation/i.test(msg)) {
        toast.error('Autorisez la recherche Wi‑Fi quand Android le demande.');
      } else {
        toast.error(msg || 'Recherche impossible');
      }
      setNetworks([]);
    } finally {
      setScanning(false);
    }
  }, [refreshStatus]);

  useEffect(() => {
    if (!isNativeApp()) return;
    refreshStatus();
    getKioskStatus().then((s) => setDeviceOwner(Boolean(s.deviceOwner)));
  }, [refreshStatus]);

  useEffect(() => {
    if (!autoScanKey || !isNativeApp() || deviceOwner) return;
    handleScan();
  }, [autoScanKey, deviceOwner, handleScan]);

  if (!isNativeApp()) return null;

  const handleOpenAndroidPanel = async () => {
    try {
      await WifiConnect.openWifiPanel();
    } catch (e) {
      toast.error(e.message || 'Panneau Wi‑Fi indisponible.');
    }
  };

  const handleEnableWifi = async () => {
    if (deviceOwner) {
      await handleOpenAndroidPanel();
      return;
    }
    try {
      await WifiConnect.setWifiEnabled({ enabled: true });
      await refreshStatus();
      toast.success('Wi‑Fi activé');
      await handleScan();
    } catch (e) {
      toast.error(e.message || 'Impossible d\'activer le Wi‑Fi');
    }
  };

  const startConnect = (network) => {
    if (network.secure) {
      setSelected(network);
      setPassword('');
      return;
    }
    connectToNetwork(network, '');
  };

  const connectToNetwork = async (network, pwd) => {
    setConnecting(true);
    try {
      await WifiConnect.connect({
        ssid: network.ssid,
        password: pwd,
        secure: network.secure,
      });
      toast.success(`Connecté à ${network.ssid}`);
      setSelected(null);
      setPassword('');
      await refreshStatus();
    } catch (e) {
      const msg = e?.message || String(e);
      toast.error(msg.includes('WIFI_DISABLED') ? 'Activez le Wi‑Fi d\'abord.' : msg || 'Connexion impossible');
    } finally {
      setConnecting(false);
    }
  };

  const wrapperClass = panelMode
    ? 'space-y-3'
    : 'space-y-3 pt-2 border-t border-slate-200 dark:border-chrome-800';

  if (deviceOwner && !panelMode) {
    return (
      <div className={wrapperClass}>
        <Label className="flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          Connexion Wi‑Fi
        </Label>
        <p className="text-xs text-slate-500 leading-relaxed">
          Ouvre le panneau Android (activer/désactiver le Wi‑Fi et choisir un réseau). Vous restez
          dans SeNote.
        </p>
        <div className="rounded-lg border border-slate-200 dark:border-chrome-700 px-3 py-2 text-sm">
          {status.connected ? (
            <p className="text-green-700 dark:text-green-400 flex items-center gap-2">
              <Wifi className="w-4 h-4 shrink-0" />
              Connecté à <span className="font-medium">{status.ssid}</span>
            </p>
          ) : (
            <p className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" />
              Non connecté
            </p>
          )}
        </div>
        <Button type="button" variant="outline" className="w-full gap-2" onClick={handleOpenAndroidPanel}>
          <Wifi className="w-4 h-4" />
          Ouvrir le Wi‑Fi
        </Button>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      {!panelMode && (
        <>
          <Label className="flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Connexion Wi‑Fi
          </Label>
          <p className="text-xs text-slate-500 leading-relaxed">
            {deviceOwner
              ? 'Panneau Android — liste des réseaux et interrupteur Wi‑Fi.'
              : 'Liste des réseaux dans SeNote (sans Device Owner).'}
          </p>
        </>
      )}

      {deviceOwner ? (
        <Button type="button" variant="outline" className="w-full gap-2" onClick={handleOpenAndroidPanel}>
          <Wifi className="w-4 h-4" />
          Ouvrir le panneau Wi‑Fi Android
        </Button>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 dark:border-chrome-700 px-3 py-2 text-sm">
            {!status.wifiEnabled ? (
              <p className="text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <WifiOff className="w-4 h-4 shrink-0" />
                Wi‑Fi désactivé
              </p>
            ) : status.connected ? (
              <p className="text-green-700 dark:text-green-400 flex items-center gap-2">
                <Wifi className="w-4 h-4 shrink-0" />
                Connecté à <span className="font-medium">{status.ssid}</span>
              </p>
            ) : (
              <p className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <Wifi className="w-4 h-4 shrink-0" />
                Wi‑Fi activé — choisissez un réseau
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {!status.wifiEnabled && (
              <Button type="button" variant="outline" className="flex-1" onClick={handleEnableWifi}>
                Activer le Wi‑Fi
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleScan}
              disabled={scanning}
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Recherche…' : 'Rechercher les réseaux'}
            </Button>
          </div>

          {networks.length > 0 && (
            <ul className={`space-y-1 overflow-y-auto thin-scroll rounded-lg border border-slate-200 dark:border-chrome-700 divide-y divide-slate-100 dark:divide-chrome-800 ${panelMode ? 'max-h-[50dvh]' : 'max-h-48'}`}>
              {networks.map((network) => (
                <li key={network.ssid}>
                  <button
                    type="button"
                    onClick={() => startConnect(network)}
                    disabled={connecting}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-chrome-900 transition-colors"
                  >
                    {network.secure ? (
                      <Lock className="w-4 h-4 shrink-0 text-slate-400" />
                    ) : (
                      <Wifi className="w-4 h-4 shrink-0 text-slate-400" />
                    )}
                    <span className="flex-1 min-w-0 truncate font-medium text-sm">{network.ssid}</span>
                    <span className="text-xs text-slate-500 shrink-0 flex items-center gap-1">
                      <Signal className="w-3 h-3" />
                      {signalLabel(network.level)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mot de passe Wi‑Fi</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Réseau : <span className="font-medium">{selected?.ssid}</span>
          </p>
          <Input
            type="password"
            autoComplete="off"
            placeholder="Mot de passe du Wi‑Fi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSelected(null)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={connecting || !password}
              onClick={() => connectToNetwork(selected, password)}
            >
              {connecting ? 'Connexion…' : 'Se connecter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentWifiSettings;
