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
import {
  clearStudentLockPin,
  hasStudentLockPin,
  setStudentLockPin,
} from '../lib/studentScreenLock';

const StudentScreenLockSettings = () => {
  const [active, setActive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setActive(await hasStudentLockPin());
  }, []);

  useEffect(() => {
    if (isNativeApp()) refresh();
  }, [refresh]);

  if (!isNativeApp()) return null;

  const handleSave = async () => {
    if (pin !== confirm) {
      toast.error('Les deux codes ne correspondent pas.');
      return;
    }
    setSaving(true);
    try {
      await setStudentLockPin(pin);
      sessionStorage.removeItem('senote-student-unlocked');
      toast.success('Code enregistré. SeNote demandera ce code au démarrage.');
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
      <p className="text-xs text-slate-500 leading-relaxed">
        Code personnel pour ouvrir SeNote (4 à 8 chiffres). Tout se passe dans l&apos;application,
        sans quitter SeNote.
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
          Créer un code
        </Button>
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
