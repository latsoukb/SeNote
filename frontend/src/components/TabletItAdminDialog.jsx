import React, { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Shield,
  Settings,
  Wrench,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';
import { toast } from 'sonner';
import { isNativeApp } from '../lib/platform';
import { getKioskStatus, enterMaintenanceMode, exitMaintenanceMode, openFullSettings } from '../lib/kioskLock';
import {
  hasCustomItPin,
  isValidItPin,
  resetItPin,
  setItPin,
  verifyItPin,
} from '../lib/itAdminPin';

const TabletItAdminDialog = ({ open, onOpenChange }) => {
  const [step, setStep] = useState('login');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({
    deviceOwner: false,
    lockTaskActive: false,
    maintenanceMode: false,
  });
  const [customPin, setCustomPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setStep('login');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, []);

  const refresh = useCallback(async () => {
    setStatus(await getKioskStatus());
    setCustomPin(await hasCustomItPin());
  }, []);

  useEffect(() => {
    if (!open || !isNativeApp()) return;
    refresh();
    resetForm();
  }, [open, refresh, resetForm]);

  if (!isNativeApp()) return null;

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const ok = await verifyItPin(password);
      if (!ok) {
        toast.error('Mot de passe IT incorrect.');
        return;
      }
      setStep('panel');
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleEnterMaintenance = async () => {
    setLoading(true);
    try {
      await enterMaintenanceMode();
      await refresh();
      toast.success('Mode maintenance activé — installation et réglages Android possibles.');
    } catch (e) {
      toast.error(e.message || 'Activation impossible');
    } finally {
      setLoading(false);
    }
  };

  const handleExitMaintenance = async () => {
    setLoading(true);
    try {
      await exitMaintenanceMode();
      await refresh();
      toast.success('Verrou kiosk réactivé.');
    } catch (e) {
      toast.error(e.message || 'Réactivation impossible');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      await openFullSettings();
      toast.message('Réglages Android — revenez à SeNote une fois terminé.');
    } catch (e) {
      toast.error(e.message || 'Ouverture impossible');
    }
  };

  const handleChangePin = async () => {
    if (!isValidItPin(newPassword)) {
      toast.error('Minimum 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await setItPin(newPassword);
      setCustomPin(true);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Mot de passe IT mis à jour sur cette tablette.');
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async () => {
    setLoading(true);
    try {
      await resetItPin();
      setCustomPin(false);
      toast.success('Mot de passe IT réinitialisé au code usine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[min(90dvh,100vh-2rem)] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            Administration IT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2 px-6 pb-6 overflow-y-auto overscroll-contain thin-scroll min-h-0 flex-1">
          {step === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Accès réservé aux techniciens. Les élèves utilisent les Paramètres normaux
                (Wi‑Fi, verrouillage, mises à jour).
              </p>
              <div className="space-y-2">
                <Label htmlFor="it-password">Mot de passe IT</Label>
                <Input
                  id="it-password"
                  type="password"
                  autoComplete="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                Accéder
              </Button>
            </form>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 dark:border-chrome-700 p-3 space-y-2 text-sm">
                <p className="font-medium">État</p>
                <StatusRow ok={status.deviceOwner} label="Device Owner actif" />
                <StatusRow
                  ok={status.lockTaskActive && !status.maintenanceMode}
                  label="Verrou kiosk actif"
                />
                <StatusRow ok={status.maintenanceMode} label="Mode maintenance IT actif" />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Maintenance tablette
                </Label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Active le mode maintenance pour installer une APK, désinstaller SeNote ou ouvrir
                  tous les réglages Android (contourne « Blocked by work policy »).
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" className="gap-2" onClick={handleEnterMaintenance} disabled={loading || status.maintenanceMode}>
                    <Unlock className="w-4 h-4" />
                    Activer
                  </Button>
                  <Button type="button" className="gap-2" onClick={handleExitMaintenance} disabled={loading || !status.maintenanceMode}>
                    <Lock className="w-4 h-4" />
                    Reverrouiller
                  </Button>
                </div>
                <Button type="button" variant="outline" className="w-full gap-2" onClick={handleOpenSettings}>
                  <Settings className="w-4 h-4" />
                  Ouvrir les réglages Android
                </Button>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-chrome-800">
                <Label>Mot de passe IT (techniciens)</Label>
                <Input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirmer"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={handleChangePin} disabled={loading}>
                    Modifier
                  </Button>
                  <Button type="button" variant="outline" onClick={handleResetPin} disabled={loading || !customPin}>
                    Réinitialiser
                  </Button>
                </div>
                <p className="text-xs text-slate-500 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Ne communiquez jamais ce mot de passe aux élèves.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StatusRow = ({ ok, label }) => (
  <p className={`flex items-center gap-2 ${ok ? 'text-green-700 dark:text-green-400' : 'text-slate-500'}`}>
    {ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
    <span>{label}</span>
  </p>
);

export default TabletItAdminDialog;
