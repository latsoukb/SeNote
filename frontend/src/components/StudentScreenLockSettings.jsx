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
import { Lock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { isNativeApp } from '../lib/platform';
import { getKioskStatus, openSystemSettings } from '../lib/kioskLock';
import {
  clearStudentLockPin,
  hasStudentLockPin,
  setStudentLockPin,
} from '../lib/studentScreenLock';

const StudentScreenLockSettings = () => {
  const [deviceOwner, setDeviceOwner] = useState(false);
  const [active, setActive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const status = await getKioskStatus();
    setDeviceOwner(Boolean(status.deviceOwner));
    if (!status.deviceOwner) {
      setActive(await hasStudentLockPin());
    }
  }, []);

  useEffect(() => {
    if (isNativeApp()) refresh();
  }, [refresh]);

  if (!isNativeApp()) return null;

  const handleOpenAndroid = async () => {
    try {
      await openSystemSettings('security');
      toast.message('Configurez votre PIN dans le panneau Android, puis revenez à SeNote.');
    } catch (e) {
      toast.error(e.message || 'Panneau indisponible — activez Device Owner d\'abord.');
    }
  };

  const handleSave = async () => {
    if (pin !== confirm) {
      toast.error('Les deux codes ne correspondent pas.');
      return;
    }
    setSaving(true);
    try {
      await setStudentLockPin(pin);
      sessionStorage.removeItem('senote-student-unlocked');
      toast.success('Code enregistré.');
      setDialogOpen(false);
      setPin('');
      setConfirm('');
      await refresh();
    } catch (e) {
      toast.error(e.message || 'Enregistrement impossible');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    await clearStudentLockPin();
    sessionStorage.removeItem('senote-student-unlocked');
    toast.message('Verrouillage désactivé.');
    await refresh();
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-chrome-800">
      <Label className="flex items-center gap-2">
        <Lock className="w-4 h-4" />
        Verrouillage de la tablette
      </Label>

      {deviceOwner ? (
        <>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ouvre le panneau Android pour choisir un PIN ou mot de passe (anti-vol au démarrage de
            la tablette). Vous restez dans SeNote.
          </p>
          <Button type="button" variant="outline" className="w-full" onClick={handleOpenAndroid}>
            Configurer le verrouillage écran
          </Button>
        </>
      ) : (
        <>
          <p className="text-xs text-slate-500 leading-relaxed">
            Code personnel SeNote (4 à 8 chiffres). Pour le verrou Android complet, activez Device
            Owner via <code className="text-[11px]">./scripts/setup-tablet.sh</code>.
          </p>
          {active ? (
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(true)}>
                Changer le code
              </Button>
              <Button type="button" variant="outline" size="icon" aria-label="Supprimer le code" onClick={handleRemove}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" className="w-full" onClick={() => setDialogOpen(true)}>
              Créer un code SeNote
            </Button>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{active ? 'Changer le code' : 'Créer un code'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Nouveau code (4–8 chiffres)"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            />
            <Input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Confirmer le code"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              disabled={saving || pin.length < 4 || confirm.length < 4}
              onClick={handleSave}
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentScreenLockSettings;
