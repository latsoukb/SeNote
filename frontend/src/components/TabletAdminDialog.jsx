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
  Wifi,
  Lock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { isNativeApp } from '../lib/platform';
import {
  getKioskStatus,
  openAdminSystemSettings,
  reEnableKiosk,
  temporarilyDisableKiosk,
} from '../lib/kioskLock';
import {
  hasAdminPin,
  isValidAdminPin,
  setAdminPin,
  verifyAdminPin,
} from '../lib/adminPin';
import AppUpdateSettings from './AppUpdateSettings';

const TabletAdminDialog = ({ open, onOpenChange }) => {
  const [step, setStep] = useState('pin');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [status, setStatus] = useState({ deviceOwner: false, lockTaskActive: false });
  const [loading, setLoading] = useState(false);

  const resetState = useCallback(() => {
    setStep('pin');
    setPin('');
    setConfirmPin('');
  }, []);

  const refreshStatus = useCallback(async () => {
    setStatus(await getKioskStatus());
  }, []);

  useEffect(() => {
    if (!open || !isNativeApp()) return;
    (async () => {
      setNeedsSetup(!(await hasAdminPin()));
      await refreshStatus();
      resetState();
    })();
  }, [open, refreshStatus, resetState]);

  if (!isNativeApp()) return null;

  const handlePinSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (needsSetup) {
        if (!isValidAdminPin(pin)) {
          toast.error('Code admin : minimum 6 chiffres.');
          return;
        }
        if (pin !== confirmPin) {
          toast.error('Les codes ne correspondent pas.');
          return;
        }
        await setAdminPin(pin);
        toast.success('Code admin enregistré.');
        setNeedsSetup(false);
        setStep('panel');
        await refreshStatus();
        return;
      }

      const ok = await verifyAdminPin(pin);
      if (!ok) {
        toast.error('Code admin incorrect.');
        return;
      }
      setStep('panel');
      await refreshStatus();
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const withPinCheck = async (action) => {
    const ok = await verifyAdminPin(pin);
    if (!ok) {
      toast.error('Code admin requis.');
      setStep('pin');
      return;
    }
    await action();
  };

  const handleOpenWifi = () =>
    withPinCheck(async () => {
      toast.message('Panneau Wi‑Fi Android — revenez à SeNote une fois connecté.');
      await openAdminSystemSettings('wifi');
    });

  const handleOpenSecurity = () =>
    withPinCheck(async () => {
      toast.message('Résumé le verrouillage écran (PIN / mot de passe).');
      await openAdminSystemSettings('security');
    });

  const handleDisableKiosk = () =>
    withPinCheck(async () => {
      await temporarilyDisableKiosk();
      toast.message('Mode kiosk désactivé temporairement. Relancez SeNote pour reverrouiller.');
    });

  const handleReEnable = async () => {
    setLoading(true);
    try {
      await reEnableKiosk();
      await refreshStatus();
      toast.success('Mode kiosk réactivé.');
    } catch (e) {
      toast.error(e.message || 'Réactivation impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetState();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[min(90dvh,100vh-2rem)] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            Administration tablette
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2 px-6 pb-6 overflow-y-auto overscroll-contain thin-scroll min-h-0 flex-1">
          {step === 'pin' ? (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {needsSetup
                  ? 'Créez un code admin (6 chiffres minimum). Il protège le Wi‑Fi, le verrouillage écran et la maintenance.'
                  : 'Entrez le code admin pour accéder à la maintenance de la tablette.'}
              </p>
              <div className="space-y-2">
                <Label htmlFor="admin-pin">Code admin</Label>
                <Input
                  id="admin-pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="tracking-widest"
                />
              </div>
              {needsSetup && (
                <div className="space-y-2">
                  <Label htmlFor="admin-pin-confirm">Confirmer le code</Label>
                  <Input
                    id="admin-pin-confirm"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="tracking-widest"
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {needsSetup ? 'Enregistrer le code admin' : 'Accéder'}
              </Button>
            </form>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 dark:border-chrome-700 p-3 space-y-2 text-sm">
                <p className="font-medium">État du verrouillage</p>
                <StatusRow
                  ok={status.deviceOwner}
                  label={
                    status.deviceOwner
                      ? 'Device Owner actif (verrouillage définitif)'
                      : 'Device Owner inactif — verrouillage contournable'
                  }
                />
                <StatusRow
                  ok={status.lockTaskActive}
                  label={status.lockTaskActive ? 'SeNote verrouillée' : 'SeNote non verrouillée'}
                />
                {!status.deviceOwner && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed flex gap-2 pt-1">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    Pour un verrouillage irréversible (pas de TikTok, pas de tuto YouTube),
                    provisionnez la tablette avec{' '}
                    <code className="text-[11px]">scripts/provision-tablet.sh</code> après
                    réinitialisation usine.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Réseau (maintenance)</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleOpenWifi}
                >
                  <Wifi className="w-4 h-4" />
                  Panneau Wi‑Fi Android
                </Button>
                <p className="text-xs text-slate-500">
                  Réservé à la maintenance. Les élèves se connectent via Paramètres → Connexion
                  Wi‑Fi (sans code admin).
                </p>
              </div>

              <div className="space-y-2">
                <Label>Sécurité anti-vol</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={handleOpenSecurity}
                >
                  <Lock className="w-4 h-4" />
                  Verrouillage écran (PIN tablette)
                </Button>
                <p className="text-xs text-slate-500">
                  Configure le code PIN / mot de passe Android affiché au démarrage de la
                  tablette (avant SeNote).
                </p>
              </div>

              <AppUpdateSettings />

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-chrome-800">
                <Label className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Maintenance
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" onClick={handleDisableKiosk}>
                    Désactiver le verrou
                  </Button>
                  <Button type="button" onClick={handleReEnable} disabled={loading}>
                    Réactiver le verrou
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Réservé à la maintenance. Les élèves ne doivent pas connaître le code admin.
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
  <p className={`flex items-center gap-2 ${ok ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-300'}`}>
    {ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
    <span>{label}</span>
  </p>
);

export default TabletAdminDialog;
