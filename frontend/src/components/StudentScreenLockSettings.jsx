import React from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { isNativeApp } from '../lib/platform';
import { openSystemSettings } from '../lib/kioskLock';

const StudentScreenLockSettings = () => {
  if (!isNativeApp()) return null;

  const handleOpen = async () => {
    try {
      await openSystemSettings('security');
      toast.message('Choisissez votre code PIN ou mot de passe, puis revenez à SeNote.');
    } catch (e) {
      toast.error(e.message || 'Impossible d\'ouvrir les réglages de sécurité');
    }
  };

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-chrome-800">
      <Label className="flex items-center gap-2">
        <Lock className="w-4 h-4" />
        Verrouillage de la tablette
      </Label>
      <p className="text-xs text-slate-500 leading-relaxed">
        Protège votre tablette au démarrage avec le code PIN ou mot de passe de votre choix
        (anti-vol).
      </p>
      <Button type="button" variant="outline" className="w-full" onClick={handleOpen}>
        Configurer le verrouillage écran
      </Button>
    </div>
  );
};

export default StudentScreenLockSettings;
