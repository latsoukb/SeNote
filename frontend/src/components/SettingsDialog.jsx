import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Settings, Download, ArrowDown, ArrowLeft } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useStudentClass } from '../context/StudentClassContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import GoogleDriveSettings from './GoogleDriveSettings';
import StudentDeviceCode from './StudentDeviceCode';
import { isNativeApp } from '../lib/platform';

const SettingsDialog = ({ trigger }) => {
  const { settings, updateSettings } = useSettings();
  const { session: studentSession } = useStudentClass();
  const { canInstall, isInstalled, install } = usePWAInstall();
  const [open, setOpen] = React.useState(false);

  const handleInstall = async () => {
    const ok = await install();
    if (ok) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="Paramètres">
            <Settings className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paramètres</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-2">
          {studentSession && <StudentDeviceCode variant="settings" />}

          <div className="space-y-3">
            <Label>Défilement des pages</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ scrollDirection: 'vertical' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.scrollDirection === 'vertical'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <ArrowDown className="w-6 h-6" />
                <span className="text-sm font-medium">Vers le bas</span>
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ scrollDirection: 'horizontal' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  settings.scrollDirection === 'horizontal'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <ArrowLeft className="w-6 h-6" />
                <span className="text-sm font-medium">Vers la gauche</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Choisissez comment faire défiler les pages dans un cahier. L&apos;ajout automatique
              de page suit la même direction.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="stylus-only">Stylet uniquement pour écrire</Label>
              <p className="text-xs text-slate-500">
                Comme GoodNotes : le stylet écrit, le doigt fait défiler la page. La paume est
                ignorée.
              </p>
            </div>
            <Switch
              id="stylus-only"
              checked={settings.stylusOnly !== false}
              onCheckedChange={(v) => updateSettings({ stylusOnly: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="auto-add">Ajout auto de page</Label>
              <p className="text-xs text-slate-500">
                Nouvelle page au même style en fin de défilement
              </p>
            </div>
            <Switch
              id="auto-add"
              checked={settings.autoAddPage}
              onCheckedChange={(v) => updateSettings({ autoAddPage: v })}
            />
          </div>

          <GoogleDriveSettings />

          {!isNativeApp() && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Label>Raccourci / installation</Label>
            {isInstalled ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                SeNote est installé sur cet appareil.
              </p>
            ) : canInstall ? (
              <Button onClick={handleInstall} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4" />
                Installer SeNote (raccourci)
              </Button>
            ) : (
              <p className="text-xs text-slate-500">
                Sur iPad/iPhone : partage Safari → « Sur l&apos;écran d&apos;accueil ».
                Sur Android/Chrome : menu → « Installer l&apos;application ».
              </p>
            )}
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
