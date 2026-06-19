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
import { Shield, Lock, Unlock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { isNativeApp } from '../lib/platform';
import {
  getKioskStatus,
  enterMaintenanceMode,
  exitMaintenanceMode,
} from '../lib/kioskLock';
import { verifyItPin } from '../lib/itAdminPin';

/** 7× logo SeNote → mot de passe IT → activer / désactiver le verrou uniquement. */
const TabletItAdminDialog = ({ open, onOpenChange }) => {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [locked, setLocked] = useState(true);
  const [deviceOwner, setDeviceOwner] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const status = await getKioskStatus();
    setDeviceOwner(Boolean(status.deviceOwner));
    setLocked(Boolean(status.lockTaskActive) && !status.maintenanceMode);
  }, []);

  const resetForm = useCallback(() => {
    setPassword('');
    setAuthenticated(false);
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
        toast.error('Mot de passe incorrect.');
        return;
      }
      setAuthenticated(true);
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLock = async () => {
    setLoading(true);
    try {
      if (locked) {
        await enterMaintenanceMode();
        toast.success('Verrou désactivé (maintenance IT).');
      } else {
        await exitMaintenanceMode();
        toast.success('Verrou activé.');
      }
      await refresh();
    } catch (e) {
      toast.error(e.message || 'Action impossible');
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            Verrou SeNote (IT)
          </DialogTitle>
        </DialogHeader>

        {!authenticated ? (
          <form onSubmit={handleLogin} className="space-y-4 pt-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Accès technicien uniquement. Les élèves utilisent Paramètres pour le Wi‑Fi et le
              verrouillage écran.
            </p>
            <div className="space-y-2">
              <Label htmlFor="it-password">Mot de passe</Label>
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
              Valider
            </Button>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-slate-200 dark:border-chrome-700 p-3 space-y-2 text-sm">
              <StatusRow ok={deviceOwner} label="Verrou définitif (Device Owner)" />
              <StatusRow ok={locked} label="Tablette verrouillée dans SeNote" />
            </div>

            {!deviceOwner ? (
              <div className="rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-2">
                <p className="font-semibold">Activer le verrou définitif (une seule fois) :</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Tablette ou émulateur <strong>sans compte Google</strong></li>
                  <li>Brancher la tablette au Mac (USB)</li>
                  <li>
                    Dans le terminal :{' '}
                    <code className="text-[11px] bg-white/60 dark:bg-black/20 px-1 rounded">
                      ./scripts/setup-tablet.sh
                    </code>
                  </li>
                  <li>Relancer SeNote — le bouclier vert apparaît dans Paramètres IT</li>
                </ol>
                <p>Sans cette étape, on peut encore quitter SeNote via Android.</p>
              </div>
            ) : (
              <Button
                type="button"
                className="w-full gap-2"
                variant={locked ? 'outline' : 'default'}
                onClick={handleToggleLock}
                disabled={loading}
              >
                {locked ? (
                  <>
                    <Unlock className="w-4 h-4" />
                    Désactiver le verrou (maintenance IT)
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Activer le verrou
                  </>
                )}
              </Button>
            )}
          </div>
        )}
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
